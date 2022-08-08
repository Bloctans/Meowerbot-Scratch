class MBotS {
    constructor (runtime, extensionId) {
		this.runtime = runtime;
    }

    getInfo () {
        return {
            "id": 'meowerbot-scratch',
            "name": 'Meower Bot',
            "blocks": [
		{
                    "opcode": 'test',
                    "blockType": "command",
                    "text": 'lol'
                }
	    ]
        };
    };
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
