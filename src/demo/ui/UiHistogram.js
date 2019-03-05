/**
 * @fileOverview UiHistogram
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************

import React from 'react';

// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************

/**
 * Class UiHistogram some text later...
 */
export default class UiHistogram extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.m_histogram = [];
  }
  componentDidMount() {
    this.updateCanvas();
  }
  componentDidUpdate() {
    this.updateCanvas();
  }
  getVolumeHistogram(vol) {
    const xDim = vol.m_xDim;
    const yDim = vol.m_yDim;
    const zDim = vol.m_zDim;
    const dataArray = vol.m_dataArray;
    const xyzDim = xDim * yDim * zDim;
    const NUM_COLORS = 256;
    this.m_histogram = new Array(NUM_COLORS);
    let i;
    for (i = 0; i < NUM_COLORS; i++) {
      this.m_histogram[i] = 0;
    }
    for (i = 0; i < xyzDim; i++) {
      const ind = dataArray[i];
      this.m_histogram[ind]++;
    }
    // calc max value in histogram
    let valMax = 0;
    for (i = 0; i < NUM_COLORS; i++) {
      valMax = (this.m_histogram[i] > valMax) ? this.m_histogram[i] : valMax;
    }
    const SOME_SMALL_ADD = 0.001;
    valMax += SOME_SMALL_ADD;
    // scale values to [0..1]
    const scl = 1.0 / valMax;
    for (i = 0; i < NUM_COLORS; i++) {
      this.m_histogram[i] *= scl;
    }
    this.smoothHistogram();
    this.getMaxPeak();
  }
  //
  //
  getMaxPeak() {
    this.m_peakIndex = -1;
    let i;
    const NUM_COLORS = 256;
    const hist = this.m_histogram;
    const MIN_SCAN = 12;
    const MAX_SCAN = NUM_COLORS - 4;
    let maxPeakVal = 0;
    for (i = MAX_SCAN; i > MIN_SCAN; i--) {
      if ((hist[i] > hist[i - 1]) && (hist[i] > hist[i + 1]) && 
        (hist[i] > hist[i - 2]) && (hist[i] > hist[i + 2])) {
        const peakVal = hist[i];
        if (peakVal > maxPeakVal) {
          maxPeakVal = peakVal;
          this.m_peakIndex = i;
        }
        // console.log(`Local histogram peak in ${this.m_peakIndex}`);
      } // if (ha slocal peak)
    } // for (all colors to scan) 
  }
  smoothHistogram() {
    const RAD = 2;
    const SIGMA = 1.2;
    const KOEF = 1.0 / (2 * SIGMA * SIGMA);
    const NUM_COLORS = 256;
    const newHist = new Array(NUM_COLORS);
    let i;
    let maxVal = 0;
    for (i = 0; i < NUM_COLORS; i++) {
      let sum = 0;
      let sumW = 0;
      for (let di = -RAD; di <= RAD; di++) {
        const ii = i + di;
        const t = di / RAD;
        const w = Math.exp(-t * t * KOEF);
        if ((ii >= 0) && (ii < NUM_COLORS)) {
          sum += this.m_histogram[ii] * w;
          sumW += w;
        }
      }
      sum /= sumW;
      maxVal = (sum > maxVal) ? sum : maxVal;

      newHist[i] = sum;
    } // for (i)
    // copy back to hist
    for (i = 0; i < NUM_COLORS; i++) {
      this.m_histogram[i] = newHist[i] / maxVal;
    } // for (i)

  } // smoothHistogram
  updateCanvas() {
    if (this.refs.canvasHistogram === undefined) {
      return;
    }
    const ctx = this.refs.canvasHistogram.getContext('2d');
    const w = this.refs.canvasHistogram.clientWidth;
    const h = this.refs.canvasHistogram.clientHeight;
    ctx.fillStyle = 'rgb(220, 220, 220)';
    ctx.fillRect(0,0, w, h);

    const vol = this.props.volume;
    if (vol !== null) {
      this.getVolumeHistogram(vol);
    }
    const NUM_COLORS = 256;

    // rect inside
    const xMin = Math.floor(0.10 * w);
    const xMax = Math.floor(0.95 * w);
    const yMin = Math.floor(0.05 * h);
    const yMax = Math.floor(0.95 * h);
    const wRect = xMax - xMin;
    const hRect = yMax - yMin;

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#0a0a0a';

    ctx.moveTo(xMin, yMax);
    ctx.lineTo(xMin, yMin);
    ctx.stroke();

    ctx.moveTo(xMin, yMax);
    ctx.lineTo(xMax, yMax);
    ctx.stroke();

    ctx.font = '10px Arial';
    ctx.fillStyle = 'rgb(120, 20, 20)';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    // detect max visible value in hist
    let maxHistValue = 1.0;
    if (this.m_peakIndex > 0) {
      maxHistValue = this.m_histogram[this.m_peakIndex] * 2;
      maxHistValue = (maxHistValue > 1.0) ? 1.0 : maxHistValue;
    }

    // draw marks
    let i;
    const NUM_X_MARKS = 4;
    for (i = 0; i <= NUM_X_MARKS; i++) {
      const x = xMin + Math.floor(wRect * i / NUM_X_MARKS);
      ctx.moveTo(x, yMax);
      ctx.lineTo(x, yMax + 6);
      ctx.stroke();
      const valMark = Math.floor(0 + NUM_COLORS * i / NUM_X_MARKS);
      ctx.fillText(valMark.toString(), x, yMax + 4);
    }
    ctx.textBaseline = 'center';
    ctx.textAlign = 'right';
    const NUM_Y_MARKS = 4;
    for (i = 0; i <= NUM_Y_MARKS; i++) {
      const y = yMax - Math.floor(hRect * i / NUM_Y_MARKS);
      ctx.moveTo(xMin, y);
      ctx.lineTo(xMin - 4, y);
      ctx.stroke();
      const valMark = (0 + maxHistValue * i / NUM_Y_MARKS);
      ctx.fillText(valMark.toFixed(2), xMin - 6, y);
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#080808';
    ctx.fillStyle = '#707070';

    ctx.beginPath();
    {
      ctx.moveTo(xMin, yMax);
      let i;
      let x, y;
      for (i = 0; i < NUM_COLORS; i++) {
        x = xMin + Math.floor(wRect * i / NUM_COLORS);
        let v = this.m_histogram[i] / maxHistValue;
        v = (v >= 1.0) ? 1.0 : v;
        y = yMax - Math.floor(hRect * v);
        ctx.lineTo(x, y);
      } // for (i) all colors
      y = yMax;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    // draw peak
    if (this.m_peakIndex > 0) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#eeeeee';
      const x = xMin + Math.floor(wRect * this.m_peakIndex / NUM_COLORS);
      let v = this.m_histogram[this.m_peakIndex] / maxHistValue;
      v = (v >= 1.0) ? 1.0 : v;
      let y = yMax - Math.floor(hRect * v);
      ctx.beginPath();
      ctx.setLineDash([5, 15]);
      ctx.moveTo(x, y);
      y = yMax;
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  /**
   * Main component render func callback
   */
  render() {
    const vol = this.props.volume;
    if (vol === undefined) {
      return <p>UiHistogram.props volume is not defined !!!</p>;
    }
    let strMsg = 'Volume histogram';
    if (vol !== null) {
      const xDim = vol.m_xDim;
      const yDim = vol.m_yDim;
      const zDim = vol.m_zDim;
      const bpp = vol.m_bytesPerVoxel;
      const strDim = xDim.toString() + '*' + yDim.toString() + '*' + zDim.toString();
      strMsg = 'Volume histogram. Dim = ' + strDim + ' bpp = ' + bpp.toString();
    }

    const jsxHist = 
    <div className="card" >
      <div className="card-header">
        {strMsg}
      </div>
      <div className="card-body">
        <canvas ref="canvasHistogram" height="250px" />
      </div>

    </div>;
    return jsxHist;
  }
}

  