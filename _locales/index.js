const { NativeModules } = require("react-native");
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
    console.log(
      "Lange def: " + NativeModules.I18nManager.localeIdentifier.split("_")[0]
    );
    console.log(this.lang);
    let lang =
      this.lang["_55"] != null
        ? this.lang["_55"]
        : NativeModules.I18nManager.localeIdentifier.split("_")[0];
    switch (lang) {
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
