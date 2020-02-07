import { useMemo } from "react";
import { SLP } from "../utils/slp-sdk-utils";

const useSimpleledgerFormat = (address: string) => {
  const addressSimpleledger = useMemo(() => {
    return SLP.Address.toSLPAddress(address);
  }, [address]);

  return addressSimpleledger;
};

export default useSimpleledgerFormat;
