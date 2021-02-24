import AsyncStorage from "@react-native-community/async-storage";
import { createStore } from "redux";

async function LangReducer(state = { value: 0 }, action) {
  switch (action.type) {
    case "Lang/get":
      console.log("value : ", state.value);
      return state.value;
    case "Lang/set":
      state.value = JSON.parse(action.value);
      console.log(state.value);
      return state.value;
    case "Lang/update":
      state.value = JSON.parse(action.value);
      return state.value;
    default:
      return state;
  }
}

// Create a Redux store holding the state of your app.
// Its API is { subscribe, dispatch, getState }.
let store = createStore(LangReducer);

const getLang = async (setLang: Function) => {
  try {
    let value: any = await AsyncStorage.getItem("@lang");
    // value previously stored
    // console.log(value.toString());
    value = JSON.parse(value).name;
    setLang(value);
  } catch (e) {
    // error reading value
    console.log(e);
  }
};

const getLangCode = async (setLang: any) => {
  try {
    let value: any = await AsyncStorage.getItem("@lang");
    // value previously stored
    // console.log(value.toString());
    value = JSON.parse(value).code;
    setLang = value;
    return setLang;
  } catch (e) {
    // error reading value
    console.log(e);
  }
};

const setLang = async (value: any) => {
  try {
    value = JSON.stringify(value);
    await AsyncStorage.setItem("@lang", value);
    store.dispatch({ type: "Lang/set", value });
  } catch (e) {
    // saving error
    console.log(e);
  }
};

export { getLang, getLangCode, setLang, store };
