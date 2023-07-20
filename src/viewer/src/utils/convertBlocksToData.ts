import { BubbleDataPoint } from 'chart.js';

export type BlockData = {
  dataPoint: BubbleDataPoint & { block: Block };
  minutesDiff: number;
  block: Block;
};

type Block = {
  startDate: string;
  endDate: string;
  id: string;
  contract: string;
};

const convertBlocksToData = (blocks?: Block[]): BlockData[] => {
  if (!blocks) {
    return [];
  }

  return blocks.map((block) => {
    const startDate = new Date(block.startDate);
    const endDate = new Date(block.endDate);
    const minutesDiff = (endDate.getTime() - startDate.getTime()) / 60000;
    const minutesInYear = 525600;
    const blockSizePercentage = (minutesDiff / minutesInYear) * 100;

    return {
      dataPoint: {
        x: parseFloat(
          `${startDate.getFullYear()}.${startDate.getMonth()}${startDate.getDay()}`
        ),
        y: 1,
        r: blockSizePercentage,
        block,
      },
      minutesDiff,
      block,
    };
  });
};

export default convertBlocksToData;
