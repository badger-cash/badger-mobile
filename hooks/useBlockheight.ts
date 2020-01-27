import { useState, useEffect } from "react";
import { getCurrentBlockheight } from "../api/rest.bitcoin";

const useBlockheight = () => {
  const [blockheight, setBlockheight] = useState(0);

  useEffect(() => {
    const updateBlockheight = async () => {
      try {
        const blockheightNow = await getCurrentBlockheight();
        setBlockheight(blockheightNow);
      } catch (e) {
        console.warn(e);
      }
    };

    updateBlockheight();
    const blockheightInterval = setInterval(updateBlockheight, 45 * 1000);

    return () => clearInterval(blockheightInterval);
  }, []);

  return blockheight;
};

export default useBlockheight;
