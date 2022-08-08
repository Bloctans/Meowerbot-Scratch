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
					"defaultValue": 'ws://server.meower.org',
				    }
		    }
	    },
            {
		"opcode":"login",
		"blockType": "command",
		"text": "Login to Meower as The user: [USR] password: [psw]",
		"arguments": {
			"USR": {
			     "type": "string",
			     "defaultValue": '',
			},
			"psw": {
				     "type": "string",
				     "defaultValue": '',
			}
		}
             },
	     {
		"opcode":"hbres",
		"blockType": "hat",
		"text": "Test hat [t]",
		"arguments": {
			"t": {
			     "type": "string",
			     "defaultValue": '',
			}
		}
             }
	   ]
        };
    };
	
    connect({SVR}) {
	cl_js = new Cloudlink(SVR);
        is_authed = false;

        function ping() {
            cl_js.send({cmd: "ping", val: ""})
        }
        setInterval(ping, 10000)    
    }
	
    hbres() {
	return true;    
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
