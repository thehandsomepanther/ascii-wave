import React, { Component } from 'react';
import './App.css';

// taken from https://gist.github.com/rosszurowski/67f04465c424a9bc0dae
function lerpColor(a, b, amount) {   
    let ah = parseInt(a.replace(/#/g, ''), 16),
      ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
      bh = parseInt(b.replace(/#/g, ''), 16),
      br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
      rr = ar + amount * (br - ar),
      rg = ag + amount * (bg - ag),
      rb = ab + amount * (bb - ab);
  
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
}

// mostly borrowed from http://jsfiddle.net/phil_mcc/sXmpD/8/#run

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dimensions: null,
      tick: 0
    };

    this.LETTER_WIDTH = 7;
    this.LETTER_HEIGHT = 12;
    this.TICK_TIME_MS = 16;
    this.WAVE_OFFSET_FROM_TOP = 70;
    
    this.NUM_WAVES = 10;
    this.NUM_BACKGROUND_WAVES = 7;
    this.BACKGROUND_WAVE_MAX_HEIGHT = 10;
    this.BACKGROUND_WAVE_COMPRESSION = 0.1;

    this.WAVE_CHARACTERS = '^`\'~*-,._';
    this.FRONT_WAVE_HEX = '#0033cc';
    this.BACK_WAVE_HEX = '#fafbfc';

    this.waves = [];
    for (let n = 0; n < this.NUM_WAVES; ++n) {
      const sineOffsets = [];
      const sineAmplitudes = [];
      const sineStretches = [];
      const offsetStretches = [];
      
      for (let i = 0; i < this.NUM_BACKGROUND_WAVES; ++i) {
        sineOffsets.push(-Math.PI + 2 * Math.PI * Math.random());
        sineAmplitudes.push(Math.random() * this.BACKGROUND_WAVE_MAX_HEIGHT);
        sineStretches.push(Math.random() * this.BACKGROUND_WAVE_COMPRESSION);
        offsetStretches.push(Math.random() * this.BACKGROUND_WAVE_COMPRESSION);
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
      width: Math.floor(canvasRect.width / this.LETTER_WIDTH),
      height: Math.floor(canvasRect.height / this.LETTER_HEIGHT),
      widthPx: canvasRect.width,
      heightPx: canvasRect.height
    };
    this.setState({
      dimensions,
      pointListList: this.makeWavePoints(dimensions.width, this.NUM_WAVES)
    });
    this.interval = setInterval(this.tick, this.TICK_TIME_MS);
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
              y: this.WAVE_OFFSET_FROM_TOP - 5 * 2,
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
    for (let i = 0; i < this.NUM_BACKGROUND_WAVES; ++i) {
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

        for (let j = 0; j < pointList.length; j++) {
          const point = pointList[j];
          const col = point.x;
          const y = point.y + this.overlapSines(col, i);
          const row = Math.floor(y);
          if (row >= mins[col]) {
            continue;
          } else if (mins[col] === undefined) {
            mins.push(row);
          } else {
            mins[col] = row;
          }

          if (grid[row] === undefined || grid[row].props.children[col] === undefined) {
            continue;
          }
          
          const charIndex = Math.floor(Math.floor(y*10 % 10) / 10 * this.WAVE_CHARACTERS.length);
          grid[row].props.children[col] = (
            <span 
              className="cell" 
              style={{ color: lerpColor(this.FRONT_WAVE_HEX, this.BACK_WAVE_HEX, i/pointListList.length) }}
              key={ col }
            >
              { this.WAVE_CHARACTERS[charIndex] }
            </span>
          );
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
