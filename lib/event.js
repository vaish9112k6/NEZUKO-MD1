const commands = [];

function addCommand(info, func) {
    const infos = {
        fromMe: info.fromMe === undefined ? true : info.fromMe,
        on: info.on === undefined ? 'text' : info.on,
        desc: info.desc === undefined ? '' : info.desc,
        pattern: info.pattern === undefined ? null : info.pattern,
        function: func
    };
    
    commands.push(infos);
    return infos;
}

module.exports = {
    addCommand,
    commands
};
