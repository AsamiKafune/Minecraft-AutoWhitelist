const fetch = require("cross-fetch");
module.exports = async (slip) => {
    let { isError, data } = await fetch(process.env.SLIPENDPOINT, {
        method: "POST",
        headers: {
			'Authorization': "Basic "+process.env.SLIPKEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "payload": slip,
			"postpaid": 1
        })
    }).then(async (res) => ({ isError: !res.ok, data: await res.json() }))
        .catch(() => ({ isError: true, data: null }));
    if (isError || data?.status?.code != 1000) {
        if (data?.status?.code == 1002) {
            return {
                isError: true,
                msg: "ขณะนี้มีผู้ใช้งานจำนวนมาก โปรดลองใหม่อีกครั้งใน 2-3 นาที",
                code: 0,
            };
        }
        if (!data?.data) return {
            isError: true,
            msg: data,
            code: 0,
        }
        else {
            if (
                data.function != "PULLSLIP" ||
                data.pullSlip == undefined
            )
                return {
                    isError: true,
                    msg: "สลิปไม่ถูกต้อง",
                    code: 0,
                };
            if (data.pullSlip.function != "TRANSFER") return {
                isError: true,
                msg: "สลิปไม่ถูกต้อง",
                code: 0,
            };
        }
    } else {
        let transferDate = new Date(data.data.pullSlip.dateTime).getTime() / 1000;
        if (new Date().getTime() / 1000 > transferDate + 900)
            return {
                isError: true,
                msg: "ไม่สามารถใช้สลิปที่มากกว่า 15 นาทีได้!",
                code: 0,
            }
        else return {
            isError: false,
            msg: "สำเร็จ!",
            code: 1,
            data: data
        }
    }
}
