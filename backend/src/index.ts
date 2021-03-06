import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';
import morgan from 'morgan';
import { v4 } from 'uuid';
import qrCode from 'qrcode';

interface QrCode {
    userId: string;
    sessionId: string;
    deviceId?: string;
}

const app = express();
const qrCodeStore: { [id: string]: QrCode } = {};
const database = {
    users: [
        { id: '1', firstName: 'Max', lastName: 'Mustermann', password: 'Test123!', email: 'm.mustermann@example.net' },
    ],
};

app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(expressSession({
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: new Date(new Date().getTime() + 1000 * 60 * 120),
        // 120 Minutes
        maxAge: 1000 * 60 * 120,
    },
}));

function checkSession(req: Request<any, any, any, { token?: string; deviceId?: string }>, res: Response, next: NextFunction) {
    const code = qrCodeStore[req.query.token];
    const user = database.users.find(u => u.id === code?.userId);
    // Log user in if a valid token is passed
    if (req.query.token && code && code.deviceId === req.query.deviceId && user) {
        req.session.user = user;
        // Link session with device
        req.session.deviceId = code.deviceId;
    }

    if (!req.session.user) {
        res.redirect('/');
    } else {
        next();
    }
}

app.use('/api/v1', (() => {
    function login(email: string, password: string): object|undefined {
        return database.users.find(u => u.email === email && u.password === password);
    }
    const router = express.Router();

    router.post('/login', (req: Request, res: Response) => {
        if (!req.body.email || !req.body.password) {
            res.status(422).send({ message: 'Email and password required' });
            return;
        }

        const user: any = login(req.body.email, req.body.password);
        if (!user) {
            res.status(403).send({ message: 'Forbidden' });
            return;
        }

        req.session.user = { ...user, password: undefined };
        res.send({ session: req.session.id });
    });

    router.post('/logout', (req: Request, res: Response) => {
        // Invalidate tokens that belong to the device that wants to logout
        if (req.session.deviceId) {
            const tokens = Object.keys(qrCodeStore).filter(key => (
                qrCodeStore[key].deviceId === req.session.deviceId
                && qrCodeStore[key].userId === req.session.user.id
            ));
            tokens.forEach((key) => {
                delete qrCodeStore[key];
            });
        }

        req.session.destroy(() => res.send({}));
    });

    router.post('/qr-code/verify', (req: Request, res: Response) => {
        if (!req.body.code || !req.body.deviceId) {
            res.status(422).send({ message: 'Code and deviceID required' });
            return;
        }

        const code = qrCodeStore[req.body.code];

        if (!code || (code.deviceId && code.deviceId !== req.body.deviceId)) {
            res.status(400).send({ message: 'Code invalid' });
            return;
        }

        // Link token with device
        qrCodeStore[req.body.code].deviceId = req.body.deviceId;
        req.session.deviceId = req.body.deviceId;
        res.send({});
    });

    return router;
})());

app.get('/qr-code', checkSession, async (req: Request, res: Response) => {
    const qrCodeValue: QrCode = {
        userId: req.session.user.id,
        sessionId: req.sessionID,
    };

    // Find QR-Code for user that is not linked with a device or generate a new one
    const qrCodeId = Object
        .keys(qrCodeStore)
        .find(id => (qrCodeStore[id].userId === req.session.user.id && !qrCodeStore[id].deviceId))
        || v4();

    qrCodeStore[qrCodeId] = qrCodeStore[qrCodeId] ? { ...qrCodeStore[qrCodeId], ...qrCodeValue } : qrCodeValue;
    const generatedQrCode = await qrCode.toDataURL(qrCodeId);

    res.render('qr-code', {
        code: generatedQrCode,
        username: req.session.user.email,
        deviceId: req.session.deviceId,
    });
});

app.get('/', (req: Request, res: Response) => {
    // Redirect to qrCode screen if logged in
    if (req.session.user && database.users.find(u => u.id === req.session.user.id)) {
        res.redirect('/qr-code');
        return;
    }

    res.render('index');
})

// app.use(checkSession, express.static(join(__dirname, '..', 'public')));

app.listen(3000, () => {
    console.log('running on 3000');
});
