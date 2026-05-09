import { User } from "@prisma/client";

export default class UserDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  role?: string;
  createdAt?: Date;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.phone = user.phone;
    this.profilePhotoUrl = user.profilePhotoUrl;
    this.createdAt = user.createdAt;
  }

  static toDTO(user: User | null): UserDTO | null {
    if (!user) return null;
    return new UserDTO(user);
  }

  /**
   * Same as toDTO but throws if user is null.
   * Use in controller code where user is guaranteed to exist.
   */
  static toSafeDTO(user: User | null): UserDTO {
    if (!user) throw new Error("User is null — cannot create DTO");
    return new UserDTO(user);
  }

  static toDTOArray(users: User[]) {
    return users.map((u) => new UserDTO(u));
  }
}