const { NativeModules } = require("react-native");
const langs = require("./index.json");
const en = require("./en/messages.json");
const ar = require("./ar/messages.json");
const { getLangCode, store } = require("../data/languages/index");

class lang {
  constructor(screen) {
    this.lang = getLangCode(this.lang);
    this.screen = screen;
  }

  update(code) {
    this.lang["_55"] = code;
    // store.dispatch({ type: 'Lang/get', payload: null })
    // store.dispatch({ type: 'Lang/set', code })
    // console.log("code :" , this.lang);
  }

  getDBlang() {
    // console.log(
    //   "Lange def: " + NativeModules.I18nManager.localeIdentifier.split("_")[0]
    // );
    // console.log(this.lang);
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
