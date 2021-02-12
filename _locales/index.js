const langs = require("./index.json");
const en = require("./en/messages.json");
const ar = require("./ar/messages.json");
const { getLangCode } = require("../data/languages/index");

class lang {
  constructor(screen) {
    this.lang = getLangCode(this.lang);
    this.screen = screen;
  }

  update() {
    setTimeout(() => {
      this.lang = getLangCode(this.lang);
    }, 50);
  }

  getDBlang() {
    console.log(this.lang);
    switch (this.lang["_55"]) {
      case "en":
        return en;
        break;
      case "ar":
        return ar;
        break;
      default:
        return en;
        break;
    }
  }

  getStr(str) {
    let data = this.getDBlang();
    return data["pages"][this.screen][str].toString();
  }
}

export default lang;
