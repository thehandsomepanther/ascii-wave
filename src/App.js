import React, { Component } from 'react';
import './App.css';

const LETTER_WIDTH = 7;
const LETTER_HEIGHT = 12;
const TICK_TIME_MS = 16;
const WAVE_OFFSET_FROM_BOTTOM = 30;

const NUM_WAVES = 6;
const NUM_BACKGROUND_WAVES = 7;
const BACKGROUND_WAVE_MAX_HEIGHT = 5;
const BACKGROUND_WAVE_COMPRESSION = 0.1;

const WAVE_CHARACTERS = '^`\'~*-,._';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dimensions: null,
      tick: 0
    }
    this.waves = [];
    this.sineOffsets = [];
    this.sineAmplitudes = [];
    this.sineStretches = [];
    this.offsetStretches = [];

    for (let n = 0; n < NUM_WAVES; ++n) {
      const sineOffsets = [];
      const sineAmplitudes = [];
      const sineStretches = [];
      const offsetStretches = [];
      
      for (let i = 0; i < NUM_BACKGROUND_WAVES; ++i) {
        sineOffsets.push(-Math.PI + 2 * Math.PI * Math.random());
        sineAmplitudes.push(Math.random() * BACKGROUND_WAVE_MAX_HEIGHT);
        sineStretches.push(Math.random() * BACKGROUND_WAVE_COMPRESSION);
        offsetStretches.push(Math.random() * BACKGROUND_WAVE_COMPRESSION);
      }

      this.waves.push({
        sineOffsets,
        sineAmplitudes,
        sineStretches,
        offsetStretches
      });
    }
  }

  componentDidMount() {
    const canvasElement = document.querySelector('#canvas');
    const canvasRect = canvasElement.getBoundingClientRect();
    const dimensions = {
      width: Math.floor(canvasRect.width / LETTER_WIDTH),
      height: Math.floor(canvasRect.height / LETTER_HEIGHT),
      widthPx: canvasRect.width,
      heightPx: canvasRect.height
    };
    this.setState({
      dimensions,
      pointListList: this.makeWavePoints(dimensions.width, NUM_WAVES)
    });
    this.interval = setInterval(this.tick, TICK_TIME_MS);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  makeWavePoints = (numPoints, numWaves) => {
    const { dimensions } = this.state;
    const pointListList = [];

    for (let i = 0; i < numWaves; i++) {
      const pointList = [];
      for (let n = 0; n < numPoints; n++) {
          // This represents a point on the wave
          let newPoint = {
              x: n,
              y: WAVE_OFFSET_FROM_BOTTOM - i * 2,
              spd: {
                y:0
              }, // speed with vertical component zero
              mass: 1
          }
          pointList.push(newPoint);
      }
      pointListList.push(pointList);
    }

    return pointListList;
  }

  overlapSines = (col, wave) => {
    const { tick } = this.state;
    let result = 0;
    for (let i = 0; i < NUM_BACKGROUND_WAVES; ++i) {
        result = result
            + this.waves[wave].sineOffsets[i]
            + this.waves[wave].sineAmplitudes[i] 
            * Math.sin(col * this.waves[wave].sineStretches[i] + tick * this.waves[wave].offsetStretches[i]);
    }
    return result;
  }

  tick = () => {
    const { tick } = this.state;
    this.setState({
      tick: tick + 1
    });
  }

  render() {
    const { dimensions, pointListList, tick } = this.state;

    let grid = null;
    if (dimensions) {
      grid = [];
      for (let row = 0; row < dimensions.height; row++) {
        let cells = [];
        for (let col = 0; col < dimensions.width; col++) {
          cells.push(<span className="cell" key={ col }></span>);
        }
        grid.push(<div className="row" key={ row }>{ cells }</div>);
      }

      const mins = [];
      for (let i = 0; i < pointListList.length; ++i) {
        const pointList = pointListList[i];

        for (let point of pointList) {
          const col = point.x;
          const y = point.y + this.overlapSines(col, i);
          const row = Math.floor(y);
  
          const charIndex = Math.floor(Math.floor(y*10 % 10) / 10 * WAVE_CHARACTERS.length);
          if (mins[col] === undefined) {
            mins.push(row);
            grid[row].props.children[col] = <span className="cell" key={ col }>{ WAVE_CHARACTERS[charIndex] }</span>;
          } else if (row < mins[col]) {
            mins[col] = row;
            grid[row].props.children[col] = <span className="cell" key={ col }>{ WAVE_CHARACTERS[charIndex] }</span>;
          }
        }
      }
    }

    return (      
      <div
        style={{
          height: '100vh',
          width: '100vw',
        }}
        id="canvas"
      >
        { grid }
      </div>
    );
  }
}

export default App;
