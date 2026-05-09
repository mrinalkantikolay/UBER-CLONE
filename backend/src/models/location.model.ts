import { redisClient } from "../config/redis";

/* ======================================================
   REDIS KEYS
====================================================== */

const Keys = {
  driversGeo: "drivers:geo",
  driverHeartbeat: (driverId: string) => `driver:${driverId}:heartbeat`,
  riderLocation: (userId: string) => `rider_location:${userId}`,
};

/* ======================================================
   CONSTANTS
   Heartbeat TTL = 10 seconds.
   If a driver doesn't update location within 10 seconds,
   they are considered offline. MVP mandates this pattern.
====================================================== */

const HEARTBEAT_TTL = 10;

/* ======================================================
   DRIVER LOCATION (Redis GEO + Heartbeat)
====================================================== */

class LocationModel {

  /**
   * Store driver location in Redis GEO set + set heartbeat.
   * Heartbeat key auto-expires in 10 seconds — if the driver
   * stops sending location updates, they become invisible
   * to GEOSEARCH queries.
   * GEOADD is O(log N) where N = number of members in the set.
   */
  async updateDriverLocation(
    driverId: string,
    lng: number,
    lat: number
  ): Promise<void> {
    const pipeline = redisClient.multi();

    /* GEOADD drivers:geo lng lat driverId */
    pipeline.geoAdd(Keys.driversGeo, {
      longitude: lng,
      latitude: lat,
      member: driverId,
    });

    /* Heartbeat with TTL — source of truth for "is driver online?" */
    pipeline.setEx(Keys.driverHeartbeat(driverId), HEARTBEAT_TTL, String(Date.now()));

    await pipeline.exec();
  }

  /**
   * Find drivers within a radius (km) of a point.
   * GEOSEARCH is O(log N + K) where K = matching members.
   * Results are filtered by heartbeat liveness — only drivers
   * who sent a location update within HEARTBEAT_TTL seconds
   * are returned. This prevents ghost matches on crashed drivers.
   */
  async getNearbyDrivers(
    lng: number,
    lat: number,
    radiusKm: number,
    limit: number = 10
  ): Promise<Array<{ member: string; distance: number; coordinates: { longitude: number; latitude: number } }>> {
    /* Use sendCommand for GEOSEARCH with WITHCOORD WITHDIST ASC COUNT */
    const rawResults: unknown[] = await redisClient.sendCommand([
      "GEOSEARCH",
      Keys.driversGeo,
      "FROMLONLAT",
      String(lng),
      String(lat),
      "BYRADIUS",
      String(radiusKm),
      "km",
      "ASC",
      "COUNT",
      String(limit * 2), // Fetch extra to account for heartbeat filtering
      "WITHDIST",
      "WITHCOORD",
    ]);

    if (!rawResults || !Array.isArray(rawResults)) return [];

    /* Parse raw GEOSEARCH results */
    const parsed = rawResults.map((entry: unknown) => {
      const arr = entry as [string, string, [string, string]];
      return {
        member: arr[0],
        distance: parseFloat(arr[1]),
        coordinates: {
          longitude: parseFloat(arr[2][0]),
          latitude: parseFloat(arr[2][1]),
        },
      };
    });

    /* Filter by heartbeat — only alive drivers */
    const alive: typeof parsed = [];
    for (const driver of parsed) {
      const heartbeat = await redisClient.get(Keys.driverHeartbeat(driver.member));
      if (heartbeat) {
        alive.push(driver);
        if (alive.length >= limit) break;
      }
    }

    return alive;
  }

  /**
   * Get a driver's last known position.
   * GEOPOS is O(1) per member.
   */
  async getDriverPosition(
    driverId: string
  ): Promise<{ longitude: number; latitude: number } | null> {
    const positions = await redisClient.geoPos(Keys.driversGeo, driverId);

    if (!positions || !positions[0]) return null;

    return {
      longitude: Number(positions[0].longitude),
      latitude: Number(positions[0].latitude),
    };
  }

  /**
   * Check if a driver is alive (has a valid heartbeat).
   * O(1) — single key check.
   */
  async isDriverAlive(driverId: string): Promise<boolean> {
    const heartbeat = await redisClient.get(Keys.driverHeartbeat(driverId));
    return heartbeat !== null;
  }

  /**
   * Remove driver from GEO set and delete heartbeat.
   * ZREM is O(log N), DEL is O(1).
   */
  async removeDriver(driverId: string): Promise<void> {
    const pipeline = redisClient.multi();
    pipeline.zRem(Keys.driversGeo, driverId);
    pipeline.del(Keys.driverHeartbeat(driverId));
    await pipeline.exec();
  }

  /* ======================================================
     RIDER LOCATION (Redis Hash / String)
  ====================================================== */

  /**
   * Store rider's latest location.
   * SET is O(1). TTL of 1 hour — stale rider locations auto-expire.
   */
  async updateRiderLocation(
    userId: string,
    lng: number,
    lat: number
  ): Promise<void> {
    const value = JSON.stringify({ lng, lat, updatedAt: Date.now() });
    await redisClient.setEx(Keys.riderLocation(userId), 3600, value);
  }

  /**
   * Get rider's latest location.
   * GET is O(1).
   */
  async getRiderLocation(
    userId: string
  ): Promise<{ lng: number; lat: number; updatedAt: number } | null> {
    const data = await redisClient.get(Keys.riderLocation(userId));
    if (!data) return null;
    return JSON.parse(data);
  }

}

export default new LocationModel();
