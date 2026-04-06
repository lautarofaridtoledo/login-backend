import { Injectable, ConflictException } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { PasswordService } from '../../common/security';
import { AuthUser } from '../../types';

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthDate: Date;
  termsAccepted: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async create(input: CreateUserInput): Promise<AuthUser> {
    const existing = await this.usersRepo.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.passwordService.hash(input.password);

    const user = await this.usersRepo.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      birthDate: input.birthDate,
      termsAccepted: input.termsAccepted,
    });

    return this.toAuthUser(user);
  }

  async findByEmail(email: string) {
    return this.usersRepo.findByEmail(email);
  }

  async findById(id: string) {
    return this.usersRepo.findById(id);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hash = await this.passwordService.hash(newPassword);
    await this.usersRepo.updatePassword(id, hash);
  }

  toAuthUser(user: { id: string; firstName: string; lastName: string; email: string }): AuthUser {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
  }
}
