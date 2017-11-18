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
      tick: 0,
      yOffset: 60,
      numWaves: 10,
      numBackgroundWaves: 7,
      backgroundWaveMaxHeight: 10,
      backgroundWaveCompression: 0.1,
      waveCharacters: '^`\'~*-,._',
      frontWaveHex: '#0033cc',
      backWaveHex: '#fafbfc'
    };

    this.LETTER_WIDTH = 7;
    this.LETTER_HEIGHT = 12;
    this.TICK_TIME_MS = 16;
  }

  componentDidMount() {
    this.init();
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      yOffset,
      numWaves,
      numBackgroundWaves,
      backgroundWaveCompression,
      backgroundWaveMaxHeight
    } = this.state;

    if (
      yOffset !== prevState.yOffset ||
      numWaves !== prevState.numWaves||
      numBackgroundWaves !== prevState.numBackgroundWaves||
      backgroundWaveCompression !== prevState.backgroundWaveCompression||
      backgroundWaveMaxHeight !== prevState.backgroundWaveMaxHeight
    ) {
      this.init();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  init = () => {
    const { numWaves, numBackgroundWaves, backgroundWaveMaxHeight, backgroundWaveCompression } = this.state;
    const canvasElement = document.querySelector('#canvas');
    const canvasRect = canvasElement.getBoundingClientRect();
    const dimensions = {
      width: Math.floor(canvasRect.width / this.LETTER_WIDTH),
      height: Math.floor(canvasRect.height / this.LETTER_HEIGHT),
      widthPx: canvasRect.width,
      heightPx: canvasRect.height
    };

    this.waves = [];
    for (let n = 0; n < numWaves; ++n) {
      const sineOffsets = [];
      const sineAmplitudes = [];
      const sineStretches = [];
      const offsetStretches = [];
      
      for (let i = 0; i < numBackgroundWaves; ++i) {
        sineOffsets.push(-Math.PI + 2 * Math.PI * Math.random());
        sineAmplitudes.push(Math.random() * backgroundWaveMaxHeight);
        sineStretches.push(Math.random() * backgroundWaveCompression);
        offsetStretches.push(Math.random() * backgroundWaveCompression);
      }

      this.waves.push({
        sineOffsets,
        sineAmplitudes,
        sineStretches,
        offsetStretches
      });
    }

    this.setState({
      dimensions,
      pointListList: this.makeWavePoints(dimensions.width, numWaves)
    });
    this.interval = setInterval(this.tick, this.TICK_TIME_MS);
  }

  makeWavePoints = (numPoints, numWaves) => {
    const { dimensions, yOffset } = this.state;
    const pointListList = [];

    for (let i = 0; i < numWaves; i++) {
      const pointList = [];
      for (let n = 0; n < numPoints; n++) {
          // This represents a point on the wave
          let newPoint = {
              x: n,
              y: yOffset - 5 * 2,
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
    const { tick, numBackgroundWaves } = this.state;
    let result = 0;
    for (let i = 0; i < numBackgroundWaves; ++i) {
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

  handleChange = (attrib, val) => {
    this.setState({
      [attrib]: val
    });
  }

  render() {
    const { 
      dimensions,
      pointListList, 
      tick, 
      yOffset,
      numWaves,
      numBackgroundWaves,
      backgroundWaveMaxHeight,
      backgroundWaveCompression,
      waveCharacters,
      frontWaveHex,
      backWaveHex,
    } = this.state;

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
          
          const charIndex = Math.floor(Math.floor(y*10 % 10) / 10 * waveCharacters.length);
          grid[row].props.children[col] = (
            <span 
              className="cell" 
              style={{ color: lerpColor(frontWaveHex, backWaveHex, i/pointListList.length) }}
              key={ col }
            >
              { waveCharacters[charIndex] }
            </span>
          );
        }
      }
    }

    return (
      <div>
        <div>
          <div>
            <label>yOffset</label>
            <input
              type="text"
              value={ yOffset }
              onChange={ e => this.handleChange('yOffset', e.target.value) }
            />
          </div>
          
          <div>
            <label>numWaves</label>
            <input
              type="text"
              value={ numWaves }
              onChange={ e => this.handleChange('numWaves', e.target.value) }
            />
          </div>
          
          <div>
            <label>numBackgroundWaves</label>
            <input
              type="text"
              value={ numBackgroundWaves }
              onChange={ e => this.handleChange('numBackgroundWaves', e.target.value) }
            />
          </div>
          
          <div>
            <label>backgroundWaveMaxHeight</label>
            <input
              type="text"
              value={ backgroundWaveMaxHeight }
              onChange={ e => this.handleChange('backgroundWaveMaxHeight', e.target.value) }
            />
          </div>
          
          <div>
            <label>backgroundWaveCompression</label>
            <input
              type="text"
              value={ backgroundWaveCompression }
              onChange={ e => this.handleChange('backgroundWaveCompression', e.target.value) }
            />
          </div>
          
          <div>
            <label>waveCharacters</label>
            <input
              type="text"
              value={ waveCharacters }
              onChange={ e => this.handleChange('waveCharacters', e.target.value) }
            />
          </div>
          
          <div>
            <label>frontWaveHex</label>
            <input
              type="text"
              value={ frontWaveHex }
              onChange={ e => this.handleChange('frontWaveHex', e.target.value) }
            />
          </div>
          
          <div>
            <label>backWaveHex</label>
            <input
              type="text"
              value={ backWaveHex }
              onChange={ e => this.handleChange('backWaveHex', e.target.value) }
            />
          </div>
          
        </div>
        <div
          style={{
            height: '100vh',
            width: '100vw',
          }}
          id="canvas"
        >
          { grid }
        </div>
      </div>
    );
  }
}

export default App;
