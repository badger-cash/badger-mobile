import { useMemo } from "react";
import { toSlpAddress } from "bchaddrjs-slp";

const useSimpleledgerFormat = (address: string) => {
  const addressSimpleledger = useMemo(() => {
    return toSlpAddress(address);
  }, [address]);

  return addressSimpleledger;
};

export default useSimpleledgerFormat;
