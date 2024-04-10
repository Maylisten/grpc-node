const path = require("path")
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// 得益于nodejs的灵活，可以根据proto文件中定义的类型，自动生成grpc.loadPackageDefinition(packageDefinition)，不需要提前编译
const PROTO_PATH = path.resolve(__dirname, './test.proto')
const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });




const userList = [
    {
        "id": "1",
        "name": "John",
        "age": 16,
        "address": {
            "code": "100001",
            "province": "California"
        }
    },
    {
        "id": "2",
        "name": "Alice",
        "age": 17,
        "address": {
            "code": "200002",
            "province": "California"
        }
    },
    {
        "id": "3",
        "name": "Bob",
        "age": 18,
        "address": {
            "code": "300003",
            "province": "Texas"
        }
    },
    {
        "id": "4",
        "name": "Emily",
        "age": 19,
        "address": {
            "code": "400004",
            "province": "Florida"
        }
    },
    {
        "id": "5",
        "name": "Michael",
        "age": 20,
        "address": {
            "code": "500005",
            "province": "Washington"
        }
    }
]


// 简单请求
function getUserById({ request: { id } }, callback) {
    const user = userList.find(item => item.id === id);
    callback(null, user)
}

// server-side streaming RPC
// 输出为流
function getUsersByProvince(call) {
    const province = call.request.province;
    userList.forEach(user => {
        if (user.address.province === province) {
            call.write(user);
        }
    })
    call.end();
}

// client-side streaming RPC
// 输入为流
function getOldestUserByIds(call, callback) {
    let result = undefined;
    call.on('data', function ({ id }) {
        const user = userList.find(item => item.id === id);
        if (result === undefined || user.age > result.age) {
            result = user;
        }
    });

    call.on('end', function () {
        callback(null, result);
    });
}

// bidirectional streaming RPC
// 输入输出均为流
function getUserByAsk(call) {
    call.on('data', function ({ id }) {
        const user = userList.find(item => item.id === id);
        setTimeout(() => {
            call.write(user);
        }, 1000)
    });
    call.on('end', function () {
        call.end();
    });
}


const server = new grpc.Server();
server.addService(grpc.loadPackageDefinition(packageDefinition).test.RouteGuide.service, {
    getUserById, getUsersByProvince, getOldestUserByIds, getUserByAsk
});


server.bindAsync('0.0.0.0:12306', grpc.ServerCredentials.createInsecure(), () => {
    console.log("监听在12306端口");
});