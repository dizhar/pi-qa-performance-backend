import * as fs from 'fs';

export class Create {
    constructor() {}

public async setSessionConfigFile(uniqueId: string) {
    let config = {
        "sessionId": uniqueId
      }

    fs.writeFileSync('./sessions/config-session.json', JSON.stringify(config));
}



}