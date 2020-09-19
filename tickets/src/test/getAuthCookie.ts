import jwt from 'jsonwebtoken';

import { app } from '../app';

export const getAuthCookie = () => {
    const id = 'MOCK_ID'
    const password = 'password';
    const payload = {
        id,
        password
    };

    const token = jwt.sign(payload, process.env.JWT_KEY!);
    const session = { jwt: token };
    const sessionJson = JSON.stringify(session);
    const base64 = Buffer.from(sessionJson).toString('base64');
    return [`express:sess=${base64}`];
};