import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { generateHashPassword } from '@/helpers/utils';
import aqp from 'api-query-params';
import { ChangePasswordAuthDto, CodeAuthDto, RegisterDto } from '@/auth/dto/registerDto';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private readonly mailerService: MailerService
  ) { }

  async isEmailExist(email: string) {
    const user = await this.userModel.exists({ email })
    if (user) {
      return true;
    }
    return false;
  }

  async create(createUserDto: CreateUserDto) {
    const { name, email, password, phone, image, address } = createUserDto;
    // check email
    const isExist = await this.isEmailExist(email);
    if (isExist) {
      throw new BadRequestException(`Email '${email}' already exist. Please try another email.`)
    }
    // hash password
    const hashPassword = await generateHashPassword(password)
    const user = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      phone,
      image,
      address
    })
    return {
      _id: user._id
    };
  }

  async findAll(query: string, current: number, pageSize: number) {
    const { filter, sort } = aqp(query);
    if (filter.current) delete filter.current;
    if (filter.pageSize) delete filter.pageSize;
    if (!current) current = 1;
    if (!pageSize) pageSize = 10;

    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (current - 1) * pageSize;

    const results = await this.userModel
      .find(filter)
      .limit(pageSize)
      .skip(skip)
      .sort(sort as any)
      .select(['-password'])

    return {
      totalPages,
      results
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email })
  }

  async update(updateUserDto: UpdateUserDto) {
    return await this.userModel.updateOne(
      { _id: updateUserDto._id },
      { ...updateUserDto }
    );
  }

  async remove(id: string) {
    //check id
    if (mongoose.isValidObjectId(id)) {
      return await this.userModel.deleteOne({ _id: id });
    }
    else {
      throw new BadRequestException("Invalid id")
    }
  }

  async handleRegister(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;
    // check email
    const isExist = await this.isEmailExist(email);
    if (isExist) {
      throw new BadRequestException(`Email '${email}' already exist. Please try another email.`)
    }
    // hash password
    const hashPassword = await generateHashPassword(password);
    const codeId = uuidv4();
    const user = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      isActive: false,
      codeId: codeId,
      // codeExpired: dayjs().add(30, 'seconds')
      codeExpired: dayjs().add(5, 'minutes')
    })
    //send email
    this.mailerService.sendMail({
      to: user.email,
      subject: 'Activate your account ✔',
      template: 'register',
      context: {
        name: user.name ?? user.email,
        activationCode: codeId
      }
    })

    return {
      _id: user._id
    };
  }

  async handleActive(codeAuthDto: CodeAuthDto) {
    const user = await this.userModel.findOne({
      _id: codeAuthDto._id,
      codeId: codeAuthDto.code
    })
    if (!user) {
      throw new BadRequestException("Your activation code is invalid or has expired")
    }
    const isBeforeCheck = dayjs().isBefore(user.codeExpired);
    if (isBeforeCheck) {
      await this.userModel.updateOne(
        { _id: codeAuthDto._id },
        { isActive: true }
      )
    }
    else {
      throw new BadRequestException("Your activation code is invalid or has expired")
    }
    return {
      isActive: isBeforeCheck
    }
  }

  async retryActive(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException("Account is not exist")
    }
    if (user.isActive) {
      throw new BadRequestException("Account has been activated")
    }
    //send email
    const codeId = uuidv4();
    await user.updateOne({
      codeId: codeId,
      codeExpired: dayjs().add(5, 'minutes')
    })

    this.mailerService.sendMail({
      to: user.email,
      subject: 'Activate your account ✔',
      template: 'register',
      context: {
        name: user.name ?? user.email,
        activationCode: codeId
      }
    })
    return { _id: user._id }
  }

  async retryPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException("Account is not exist")
    }

    //send email
    const codeId = uuidv4();
    await user.updateOne({
      codeId: codeId,
      codeExpired: dayjs().add(5, 'minutes')
    })

    this.mailerService.sendMail({
      to: user.email,
      subject: 'Change your password account ✔',
      template: 'register',
      context: {
        name: user.name ?? user.email,
        activationCode: codeId
      }
    })
    return {
      _id: user._id,
      email: user.email
    }
  }

  async changePassword(data: ChangePasswordAuthDto) {
    const user = await this.userModel.findOne({ email: data.email });
    if (!user) {
      throw new BadRequestException("Account is not exist")
    }
    if (data.password !== data.confirmPassword) {
      throw new BadRequestException("Passwords do not match")
    }
    // check expire code
    const isBeforeCheck = dayjs().isBefore(user.codeExpired);
    if (isBeforeCheck) {
      const newPassword = await generateHashPassword(data.password);
      await user.updateOne(
        { password: newPassword }
      )
    }
    else {
      throw new BadRequestException("Your activation code is invalid or has expired")
    }
    return {
      success: isBeforeCheck
    }
  }
}
