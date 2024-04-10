const path = require("path");
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = path.resolve(__dirname, './test.proto')
const SERVER_URL = "localhost:12306";

const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
const RouteGuide = new grpc.loadPackageDefinition(packageDefinition).test.RouteGuide;
const client = new RouteGuide(SERVER_URL,
    grpc.credentials.createInsecure());

async function runGetUserById() {
    return new Promise((resolve, reject) => {
        client.getUserById({ id: "1" }, (error, user) => {
            if (error) {
                reject(error);
            } else {
                resolve(user);
            }
        });
    })

}

async function runGetUsersByProvince() {
    return new Promise((resolve, reject) => {
        const call = client.getUsersByProvince({ province: "California" })
        const userList = []
        call.on("data", (user) => { userList.push(user) })
        call.on("end", () => {
            resolve(userList)
        })
        call.on("error", (error) => {
            reject(error)
        })
    })
}

async function runGetOldestUserByIds() {
    return new Promise((resolve, reject) => {
        const call = client.getOldestUserByIds((error, result) => {
            if (error) {
                reject(error)
            } else {
                resolve(result)
            }
        });
        const userIdList = ["1", "2", "3", "4"];
        userIdList.forEach((id) => {
            call.write({ id });
        })
        call.end()
    })
}

async function runGetUserByAsk() {
    return new Promise((resolve, reject) => {
        try {
            const results = []
            const call = client.getUserByAsk();
            const userIdList = ["1", "2", "3", "4", "5"];
            let index = 0;
            const sendNext = () => {
                if (index < userIdList.length) {
                    call.write({ id: userIdList[index++] });
                } else {
                    call.end()
                    resolve(results)
                }
            }
            call.on("data", (user) => {
                results.push(user)
                console.log(user);
                sendNext();
            })
            sendNext();
        } catch (error) {
            reject(error)
        }
    })
}

async function main() {
    console.log("================================runGetUserById=================================");
    console.log(await runGetUserById());
    console.log("==============================runGetUsersByProvince===================================");
    console.log(await runGetUsersByProvince());
    console.log("===============================runGetOldestUserByIds==================================");
    console.log(await runGetOldestUserByIds());
    console.log("==============================runGetUserByAsk===================================");
    // console.log(await runGetUserByAsk());
    await runGetUserByAsk();
}

main()
