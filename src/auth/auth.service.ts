import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { User } from 'src/typeorm/user.entity';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  //   REGISTER USER
  async registerUser(user: User, res: Response) {
    const { name, email, password } = user;

    //check for required fields
    if (!name?.trim() || !email?.trim() || !password.trim()) {
      return res.status(500).send({
        message: 'Not all required fields have been filled in.',
      });
    }

    try {
      const user = await this.userRepository.save({
        name,
        email,
        password: await bcryptjs.hash(password, 12),
      });
      console.log(user);
      res.status(200).send(user);
    } catch (error) {
      console.error(error);

      if (error instanceof QueryFailedError) {
        //@ts-ignore
        if (error.code === '23505') {
          //@ts-ignore
          console.error(`Unique constraint ${error.constraint} failed`);
          return res
            .status(500)
            .send({ message: 'There is already a user with this email.' });
        }
      }
      return res.status(500).send({ message: error });
    }
  }

  // LOGIN USER
  async loginUser(user: User, res: Response) {
    const { email, password } = user;

    // check required fields
    if (!email?.trim() || !password.trim()) {
      return res.status(500).send({
        message: 'Not all required fields have been filled in.',
      });
    }
    const userDB = await this.userRepository.findOne({ where: { email } });

    // user notfound or wrong password

    if (!user || !(await bcryptjs.compare(password, userDB.password))) {
      res.status(500).send({
        message: 'Invalid Credentials.',
      });
    }
    const token = sign({ id: userDB.id }, 'access_secret', {
      expiresIn: 60 * 60,
    });

    const refreshToken = sign({ id: userDB.id }, 'refresh_secret', {
      expiresIn: 24 * 60 * 60,
    });

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, //1 day
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
    });

    res.status(200).send({
      message: 'Login Success.',
      data: {
        userdetail: userDB,
        token: token,
        refreshToken: refreshToken,
      },
    });
  }
  //   AUTH USER
  async authUser(req: Request, res: Response) {
    try {
      const token = req.cookies['token'];
      const payload: any = verify(token, 'access_secret');
      if (!payload) {
        return res.status(401).send({
          message: 'Tidak terautentikasi.',
        });
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.id },
      });

      if (!user) {
        return res.status(401).send({
          message: 'Tidak terautentikasi.',
        });
      }
      // Mengembalikan token dan detail user untuk digunakan di frontend dengan format yang lebih sesuai untuk frontend
      return res.status(200).send({
        message: 'Autentikasi berhasil.',
        data: {
          userdetail: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          token: token,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: error });
    }
  }

  //   REFRESH USER
  async refreshUser(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies['refreshToken'];
      const payload: any = verify(refreshToken, 'refresh_secret');

      if (!payload) {
        return res.status(401).send({
          message: 'Unauthenticated.',
        });
      }

      const token = sign({ id: payload.id }, 'access_secret', {
        expiresIn: 60 * 60,
      });
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(200).send({
        message: 'Refresh success.',
      });
    } catch (error) {
      return res.status(500).send({
        message: error,
      });
    }
  }
  //   LOGOUT USER

  async logoutUser(res: Response) {
    res.cookie('token', '', {
      maxAge: 0,
    });
    res.cookie('refreshToken', '', {
      maxAge: 0,
    });

    return res.status(200).send({
      message: 'logged out.',
    });
  }
}
