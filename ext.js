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
        this.pingIntervalId = null;
        this.ws = new WebSocket(server);
        this.ws.onopen = async () => {
            this.send({
                cmd: 'direct',
                val: { cmd: 'type', val: 'js' },
            });
	        this.send({
                cmd: 'direct',
                val: "meower",
            });
            this.pingIntervalId = setInterval(this.ping, 10000);
            this.emit('connected');
        };
        this.ws.onmessage = (socketdata) => {
            var data = JSON.parse(socketdata.data);
            console.log(data)
            this.emit(data.cmd, data);
        };
        this.ws.onclose = () => {
            clearInterval(this.pingIntervalId);
            this.emit('disconnected');
        };
        this.ws.onerror = (e) => {
            this.emit('error', e);
        };
    }
    send(data) {
        this.ws.send(JSON.stringify(data));
    }
    ping() {
        cljs.send({cmd: "ping", val: ""});  // bruh why can't js get context within an interval
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

let isAuthed = false;
let cljs = null;

let recPacket = "";
let ulist = "";

let oldPacket = "";
let updatePacket = false;
let packetHat = false;

let connected = false;

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
		    "text": 'Connect to [SVR]',
			    "arguments": {
				    "SVR": {
					"type": "string",
					"defaultValue": 'wss://server.meower.org',
				    }
		    }
	    },
        {
		    "opcode": 'disconnect',
		    "blockType": "command",
		    "text": 'Disconnect'
	    },
        {
		    "opcode": 'currpacket',
		    "blockType": "reporter",
		    "text": 'Latest packet',
	    },
        {
		    "opcode": 'ulist',
		    "blockType": "reporter",
		    "text": 'Online users list',
	    },
        {
		"opcode":"login",
		"blockType": "command",
		"text": "Login to Meower as [USR] with password [psw]",
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
		"text": "When authenticated"
             },
	     {
		"opcode":"on_connect",
		"blockType": "hat",
		"text": "When connected"
             },
	     {
		"opcode":"sendpacket",
		"blockType": "command",
		"text": "Send raw packet [packet]",
		"arguments": {
			"packet": {
			     "type": "string",
			     "defaultValue": '',
			}
		}
             },
	     {
		"opcode":"sendPost",
		"blockType": "command",
		"text": "Send post to [channel] with content [content]",
		"arguments": {
			"channel": {
			     "type": "string",
			     "defaultValue": "home",
			},
            "content": {
                "type": "string",
                "defaultValue": "Hello world!"
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
                    "text": "When new server packet received"
                },
        ]
        };
    };
	
    sendPost({channel, content}) {
        if (channel == 'home') {
            cljs.send({cmd: "direct", val: {cmd: "post_home", val: content}, listener: "send_post"});
        } else {
            cljs.send({cmd: "direct", val: {cmd: "post_chat", val: {chatid: channel, p: content}}, listener: "send_post"});
        }
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
				json = JSON.parse('' + JSON_STRING);
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
        if (isAuthed) {
            return true;
        } else {
            return false;
        }
    }

    on_packet() {
        if (packetHat == true) {
            return true;
            packetHat = false
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
        cljs.send(packet)
    }

    currpacket() {
        return JSON.stringify(recPacket)
    }

    ulist() {
        return ulist
    }
	    
    login({USR, psw}) {
        cljs.send({ cmd: "direct", val: {cmd: "authpswd", val: {username: USR, pswd: psw}}, listener: "authpswd"})
	    cljs.on('direct', (data) => {
            if (data.listener == "authpswd") {
                console.log("auth found")
                if (data.val.mode == "auth") {
                    isAuthed = true;
                }
            }
       })
    }
	
    connect({SVR}) {
        cljs = new Cloudlink(SVR);
  
        cljs.on('connected', () => {
            connected = true;
        })

        cljs.on('disconnected', () => {
            connected = false;
            isAuthed = false;
        })

        cljs.on('direct', (data) => {
            recPacket = data;
            packetHat = true;
        })

        cljs.on('ulist', (data) => {
            ulist = data.val;
        })
    }

    disconnect() {
        cljs.disconnect();
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
