import express, { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';
import morgan from 'morgan';
import { v4 } from 'uuid';
import qrCode from 'qrcode';

interface QrCode {
    userId: string;
}

const app = express();
const qrCodeStore: { [id: string]: QrCode } = {};

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(expressSession({
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: new Date(new Date().getTime() + 60000),
    }
}));

function checkSession(req: Request, res: Response, next: NextFunction) {
    if (!req.session.user) {
        res.redirect('/');
    } else {
        next();
    }
}

app.use((req: Request, _: Response, next: NextFunction) => {
    console.log(req.session);
    console.log(req.session.id);
    console.log(req.session.user);
    next();
});

app.get('/login', (req: Request, res: Response) => {
    req.session.user = { id: 1, firstName: 'Max', lastName: 'Mustermann' };
    res.redirect('/private.html');
});

app.get('/qr-code', checkSession, async (req: Request, res: Response) => {
    const qrCodeValue: QrCode = {
        userId: req.session.user.id,
    };
    const qrCodeId = v4();

    qrCodeStore[qrCodeId] = qrCodeValue;
    const generatedQrCode = await qrCode.toDataURL(qrCodeId);
    res.send(`<img src="${generatedQrCode}">`);
});

app.post('/qr-code/redeem', (req: Request, res: Response) => {
    if (!req.body.code) {
        res.send('Code not passed').status(422);
        return;
    }

    const code = qrCodeStore[req.body.code];
    if (!code) {
        res.send('Forbidden').status(403);
        return;
    }

    req.session.user = { id: 1, firstName: 'Max', lastName: 'Mustermann' };
    res.send({ session: req.session.id });
});

app.get('/', (_: Request, res: Response) => {
    res.sendFile(join(__dirname, '..', 'public/index.html'));
})

app.use(checkSession, express.static(join(__dirname, '..', 'public')));

app.listen(3000, () => {
    console.log('running on 3000');
});
