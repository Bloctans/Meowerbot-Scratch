// Type your JavaScript code here.
// Type your JavaScript code here.

// ok so to add:
// raw packet send
// on new packet
// split
// http request

class Cloudlink {
    constructor(server) {
        this.events = {};
        this.ws = new WebSocket(server);
        this.ws.onopen = async () => {
            this.send({
                cmd: 'direct',
                val: {
                    cmd: 'ip',
                    val: await (await fetch('https://api.meower.org/ip')).text(),
                },
            });
            this.send({
                cmd: 'direct',
                val: { cmd: 'type', val: 'js' },
            });
	        this.send({
                cmd: 'direct',
                val: "meower",
            });
            this.emit('connected');
        };
        this.ws.onmessage = (socketdata) => {
            var data = JSON.parse(socketdata.data);
            console.log(data)
            this.emit(data.cmd, data);
        };
        this.ws.onclose = () => {
            this.emit('disconnected');
        };
        this.ws.onerror = (e) => {
            this.emit('error', e);
        };
    }
    send(data) {
        this.ws.send(JSON.stringify(data));
    }
    on(event, cb) {
        if (typeof this.events[event] !== 'object')
            this.events[event] = [];
        this.events[event].push(cb);
    }
    emit(event, data) {
        if (typeof this.events[event] !== 'object')
            return;
        this.events[event].forEach((cb) => cb(data));
    }
    disconnect() {
        this.ws.close();
    }
}

let is_authed = false
let cl_js = null

let recpacket = " "
let ulist = " "

let oldpacket = " "
let updatepacket = false
let packethat = false

let connected = false

class MBotS {
    constructor (runtime, extensionId) {
		this.runtime = runtime;
    }

    getInfo () {
        return {
            "id": 'meowerbot',
            "name": 'Meower Bot',
            "blocks": [
	    {
		    "opcode": 'connect',
		    "blockType": "command",
		    "text": 'Connect To The Server: [SVR]',
			    "arguments": {
				    "SVR": {
					"type": "string",
					"defaultValue": 'wss://server.meower.org',
				    }
		    }
	    },
        {
		    "opcode": 'currpacket',
		    "blockType": "reporter",
		    "text": 'Recent Packet',
	    },
        {
		    "opcode": 'ulist',
		    "blockType": "reporter",
		    "text": 'User list',
	    },
        {
		"opcode":"login",
		"blockType": "command",
		"text": "Login to Meower as The user: [USR] password: [psw]",
		"arguments": {
			"USR": {
			     "type": "string",
			     "defaultValue": 'mbscratch_default',
			},
			"psw": {
				     "type": "string",
				     "defaultValue": 'mbscratch_default',
			}
		}
             },
	     {
		"opcode":"on_auth",
		"blockType": "hat",
		"text": "On Authentication:"
             },
	     {
		"opcode":"on_connect",
		"blockType": "hat",
		"text": "On connection to Server:"
             },
	     {
		"opcode":"sendpacket",
		"blockType": "command",
		"text": "Send raw packet [packet]",
		"arguments": {
			"packet": {
			     "type": "string",
			     "defaultValue": ' ',
			}
		}
             },
	     {
		"opcode":"sendmsg",
		"blockType": "command",
		"text": "Send message of [msg]",
		"arguments": {
			"msg": {
			     "type": "string",
			     "defaultValue": 'Test!',
			}
		}
             },
        {
					"opcode": 'parseJSON',
					"blockType": "reporter",
					"text": '[PATH] of [JSON_STRING]',
					"arguments": {
						"PATH": {
							"type": "string",
							"defaultValue": 'fruit/apples',
						},
						"JSON_STRING": {
							"type": "string",
							"defaultValue": '{"fruit": {"apples": 2, "bananas": 3}, "total_fruit": 5}',
						},
					},
				},
                {
                    "opcode": "ReplaceSubString",
                    "blockType": "reporter",
                    "text": "replace [replace] in [original] to [to]",
                    "arguments": {
                        "replace": {
                            "type": "string",
                            "defaultValue": "foo"
                        },
                        "original": {
                            "type": "string",
                            "defaultValue": "the land of foos"
                        },
                        "to": {
                            "type": "string",
                            "defaultValue": "bar"

                        }
                    }
                },
                {
                    "opcode": "on_packet",
                    "blockType": "hat",
                    "text": "On a server packet do:"
                },
        ]
        };
    };
	
    sendmsg({msg}) {
	    cl_js.send({cmd: "direct", val: {cmd: "post_home", val: msg}, listener: "post_home"})
    }
	
    parseJSON({
		PATH,
		JSON_STRING
	}) {
		try {
			const path = PATH.toString().split('/').map(prop => decodeURIComponent(prop));
			if (path[0] === '') path.splice(0, 1);
			if (path[path.length - 1] === '') path.splice(-1, 1);
			let json;
			try {
				json = JSON.parse(' ' + JSON_STRING);
			} catch (e) {
				return e.message;
			};
			path.forEach(prop => json = json[prop]);
			if (json === null) return 'null';
			else if (json === undefined) return '';
			else if (typeof json === 'object') return JSON.stringify(json);
			else return json.toString();
		} catch (err) {
			return '';
		};
	};
    ReplaceSubString({replace, original, to}) {
        var a = original.toString().replace(replace, to);

        return a;
    }
    
    on_auth() {
        if (is_authed) {
            return true;
        } else {
            return false;
        }
    }

    on_packet() {
        if (packethat == true) {
            return true;
            packethat = false
        } else {
            return false;
        }
    }
	
    on_connect() {
        if (connected)  {
            return true;	
        } else {
            return false;
        }
    }

    sendpacket({packet}) {
        cl_js.send(packet)
    }

    currpacket() {
        return JSON.stringify(recpacket)
    }

    ulist() {
        return ulist
    }
	    
    login({USR, psw}) {
        cl_js.send({ cmd: "direct", val: {cmd: "authpswd", val: {username: USR, pswd: psw}}, listener: "authpswd"})
	    cl_js.on('direct', (data) => {
            if (data.listener == "authpswd") {
                console.log("auth found")
                if (data.val.mode == "auth") {
                    is_authed = true;
                }
            }
       })
    }
	
    connect({SVR}) {
        cl_js = new Cloudlink(SVR);
            is_authed = false;

            function ping() {
                cl_js.send({cmd: "ping", val: ""})
            }
            setInterval(ping, 10000) 
            
        cl_js.on('connected', () => {
            connected = true
        })

        cl_js.on('direct', (data) => {
            recpacket = data
            packethat = true
        })

        cl_js.on('ulist', (data) => {
            ulist = data.val
        })
    }
};

(function() {
    var extensionClass = MBotS;
    if (typeof window === "undefined" || !window.vm) {
        Scratch.extensions.register(new extensionClass());
		console.log("Sandboxed mode detected, performance will suffer because of the extension being sandboxed.");
    } else {
        var extensionInstance = new extensionClass(window.vm.extensionManager.runtime);
        var serviceName = window.vm.extensionManager._registerInternalExtension(extensionInstance);
        window.vm.extensionManager._loadedExtensions.set(extensionInstance.getInfo().id, serviceName);
		console.log("Unsandboxed mode detected. Good.");
    };
})()
