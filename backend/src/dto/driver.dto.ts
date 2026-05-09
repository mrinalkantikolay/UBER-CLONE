import { Driver, Vehicle, DriverDocument } from "@prisma/client";

/* ======================================================
   DRIVER DTO
====================================================== */

export class DriverDTO {
  id: string;
  userId: string;
  vehicleNumber: string;
  licenseNumber: string;
  status: string;
  createdAt: Date;

  constructor(driver: Driver) {
    this.id = driver.id;
    this.userId = driver.userId;
    this.vehicleNumber = driver.vehicleNumber;
    this.licenseNumber = driver.licenseNumber;
    this.status = driver.status;
    this.createdAt = driver.createdAt;
  }

  static toDTO(driver: Driver | null): DriverDTO | null {
    if (!driver) return null;
    return new DriverDTO(driver);
  }
}

/* ======================================================
   VEHICLE DTO
====================================================== */

export class VehicleDTO {
  id: string;
  type: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;

  constructor(vehicle: Vehicle) {
    this.id = vehicle.id;
    this.type = vehicle.type;
    this.make = vehicle.make;
    this.model = vehicle.model;
    this.year = vehicle.year;
    this.licensePlate = vehicle.licensePlate;
    this.color = vehicle.color;
  }

  static toDTO(vehicle: Vehicle | null): VehicleDTO | null {
    if (!vehicle) return null;
    return new VehicleDTO(vehicle);
  }
}

/* ======================================================
   DOCUMENT DTO
====================================================== */

export class DocumentDTO {
  id: string;
  type: string;
  documentUrl: string;
  verified: boolean;
  expiresAt: Date | null;
  createdAt: Date;

  constructor(doc: DriverDocument) {
    this.id = doc.id;
    this.type = doc.type;
    this.documentUrl = doc.documentUrl;
    this.verified = doc.verified;
    this.expiresAt = doc.expiresAt;
    this.createdAt = doc.createdAt;
  }

  static toDTO(doc: DriverDocument | null): DocumentDTO | null {
    if (!doc) return null;
    return new DocumentDTO(doc);
  }

  static toDTOArray(docs: DriverDocument[]): DocumentDTO[] {
    return docs.map((d) => new DocumentDTO(d));
  }
}

/* ======================================================
   DRIVER PROFILE DTO (combined)
====================================================== */

type DriverWithRelations = Driver & {
  vehicle: Vehicle | null;
  documents: DriverDocument[];
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    profilePhotoUrl: string | null;
  };
};

export class DriverProfileDTO {
  driver: DriverDTO;
  vehicle: VehicleDTO | null;
  documents: DocumentDTO[];
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    profilePhotoUrl: string | null;
  };

  constructor(data: DriverWithRelations) {
    this.driver = new DriverDTO(data);
    this.vehicle = data.vehicle ? new VehicleDTO(data.vehicle) : null;
    this.documents = data.documents
      ? DocumentDTO.toDTOArray(data.documents)
      : [];
    this.user = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      phone: data.user.phone,
      profilePhotoUrl: data.user.profilePhotoUrl,
    };
  }

  static toDTO(data: DriverWithRelations | null): DriverProfileDTO | null {
    if (!data) return null;
    return new DriverProfileDTO(data);
  }
}
