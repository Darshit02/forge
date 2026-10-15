import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';

class CreateUserDto {
  @ApiProperty({ example: 'Charlie' })
  name!: string;

  @ApiProperty({ example: 'charlie@example.com' })
  email!: string;
}

@ApiTags('System')
@Controller()
export class AppController {
  private users = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ];

  @Get('health')
  @ApiOperation({ summary: 'System health check' })
  @ApiResponse({ status: 200, description: 'Service status' })
  getHealth() {
    return { status: 'ok', service: 'nestjs-backend' };
  }

  @Get('users')
  @ApiTags('Users')
  @ApiOperation({ summary: 'Retrieve all users' })
  getUsers() {
    return this.users;
  }

  @Post('users')
  @ApiTags('Users')
  @ApiOperation({ summary: 'Create user' })
  createUser(@Body() body: CreateUserDto) {
    const newUser = { id: this.users.length + 1, ...body };
    this.users.push(newUser);
    return newUser;
  }
}
