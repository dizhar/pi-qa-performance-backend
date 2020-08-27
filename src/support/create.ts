import * as fs from 'fs';

export class Create {
    constructor() {}

public async setSessionConfigFile(uniqueId: string) {
    let config = {
        "sessionId": uniqueId
      }

     await this.craeteDir("./sessions");
    fs.writeFileSync('./sessions/config-session.json', JSON.stringify(config));
}

public async craeteDir(dirname: string) {
    let dir = `${dirname}`;

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}


}

