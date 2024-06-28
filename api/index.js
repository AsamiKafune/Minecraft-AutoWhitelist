const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient();
const { Rcon } = require("rcon-client")

const fastify = require("fastify")({ logger: false, trustProxy: true })
require("dotenv").config()
const middleware = require("./functions/middleware")

let conf = {
    bankNumber: "6402216024",
    bankNo: "004",
    amount: 200,
    mcrcon: {
        ip: "127.0.0.1",
        port: "25575",
        password: "23AB@lnwza1234!KFNx"
    }
}

fastify.options('*', function (request, reply) {
    reply.send()
})

fastify.addHook('onSend', function (request, reply, payload, next) {
    reply.header('Access-Control-Allow-Origin', '*')
    reply.header('Access-Control-Allow-Headers', '*')
    next()
})


fastify.get("/", async (req, res) => {
    return {
        code: 1,
        msg: "Hello world"
    }
})

fastify.post("/whitelist", { preHandler: [middleware.googleRecapcha] }, async (req, res) => {
    const { slip, name } = req.body;
    if (!slip.length) return res.send({ msg: "กรุณาอัพโหลดสลิปให้ถูกต้อง", code: 0 });
    if (!name.length) return res.send({ msg: "กรุณากรอกชื่อ!", code: 0 });

    //scanslip
    const slipData = await require("./functions/bank")(slip)
    if (!slipData) return res.send({
        msg: "เกิดปัญหาการเชื่อมต่อกับระบบเช็คยอด โปรดติดต่อผู้ดูแลระบบ", code: 0
    })
    if (slipData.isError) {
        return res.send({ msg: slipData.msg, code: 0 })
    } else {
        const pullSlip = slipData?.data?.data?.pullSlip;
        const check = await prisma.transactionBank.findFirst({
            where: {
                Tranref: pullSlip.transRef
            }
        }).catch((e) => {
            console.log(e)
            return res.send({
                msg: "ผิดพลาดไม่สามารถเช็คข้อมูลได้",
                code: 0,
            });
        });
        if (check)
            return res.send({
                msg: "สลิปนี้มีการเรียกใช้งานแล้ว!",
                code: 0,
            });

        let accountNumber =
            pullSlip.receiver.accountNumber ||
            pullSlip.receiver.proxyNumber;
        if (
            String(pullSlip.receiver.bankLogo).slice(20, -4) !=
            conf.bankNo
        )
            return res.send({
                msg: "ผิดพลาด! ธนาคารปลายไม่ถูกต้อง",
                code: 0,
            });

        if (!checkSame(accountNumber, conf.bankNumber))
            return res.send({ msg: "ไม่สามารถตรวจสอบได้หรือปลายทางไม่ถูกต้อง", code: 0 });

        // check amount
        if (parseInt(slipData?.data?.data?.amount) < conf.amount) return res.send({
            msg: "จำนวนเงินไม่ครบกรุณาติดต่อทีมงานด้วยตนเอง", code: 0
        })

        await prisma.transactionBank.create({
            data: {
                amount: slipData?.data?.data?.amount,
                ref: slip,
                Tranref: pullSlip.transRef
            }
        }).catch((e) => {
            console.log(e)
            return res.send({
                msg: "ผิดพลาดไม่สามารถสร้างฐานข้อมูลได้ (transaction)",
                code: 0,
            });
        });

        await prisma.whitelist.create({
            data: {
                slipDetail: pullSlip,
                username: name
            }
        }).catch((e) => {
            console.log(e)
            return res.send({
                msg: "ผิดพลาดไม่สามารถสร้างฐานข้อมูลได้ (whitelist)",
                code: 0,
            });
        });

        try {
            const rcon = await Rcon.connect({
                host: conf.mcrcon.ip, port: conf.mcrcon.port, password: conf.mcrcon.password
            })
            await rcon.send("whitelist add " + name)
            rcon.end()
        } catch (error) {
            return res.send({ msg: "ไม่สามารถแอด whitelist ได้กรุณาติดต่อผู้ดูแล", code: 0 })
        }

        return {
            code: 1,
            msg: "กรุณาลองเข้าเซิร์ฟเวอร์ผ่าน Launcher หากไม่ได้ให้ติดต่อผู้ดูแลระบบ"
        }
    }
})

const start = async () => {
    try {
        await fastify.listen({ port: process.env.PORT, host: "0.0.0.0" }).then(() => {
            console.log("[Logs] server has start on", process.env.PORT)
        })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()

function checkSame(input, origin) {
    origin = origin?.replaceAll('-', '');
    input = input?.replaceAll('-', '');
    if (origin?.length !== input?.length) return false;
    let same = 0;
    for (let i = 0; i < input.length; ++i) {
        if (isNumeric(input[i])) {
            if (input[i] !== origin[i]) return false;
            same++;
        }
    }
    if (same < 3) return false;
    return true;
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}