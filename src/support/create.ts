import * as fs from 'fs';

export class Create {
    constructor() {}

public async setSessionConfigFile(uniqueId: string) {
    let config = {
        "sessionId": uniqueId
      }

     await craeteDir("sessions");
    fs.writeFileSync('./sessions/config-session.json', JSON.stringify(config));
}



}

async function  craeteDir(dirname: string) {
    var dir = `./${dirname}`;

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}
