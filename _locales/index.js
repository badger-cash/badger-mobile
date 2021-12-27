const { NativeModules } = require("react-native");
const langs = require("./index.json");
const en = require("./en/messages.json");
const ar = require("./ar/messages.json");
const { get_lang } = require("../data/languages/index");

class lang {
  constructor(screen) {
    get_lang(data => {
      // console.log("data : ", data);
      let value = JSON.parse(data).code;
      // console.log(value);
      this.lang = value == this.lang ? this.lang : value;
    });
    console.log(this.lang);
    this.screen = screen;
  }

  getDBlang() {
    let lang =
      typeof this.lang == "string"
        ? this.lang
        : NativeModules.I18nManager.localeIdentifier.split("_")[0];

    switch (lang) {
      case "en":
        return require("./en/messages.json");
        break;
      case "ar":
        return require("./ar/messages.json");
        break;
      default:
        return require("./en/messages.json");
        break;
    }
  }

  getStr(str) {
    let data = this.getDBlang();
    return data["pages"][this.screen][str];
  }
}

export default lang;
