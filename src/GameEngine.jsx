import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Zap, Infinity, ArrowLeft, Trophy, Settings } from 'lucide-react';

const BrickBreakerGame = () => {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [selectedMode, setSelectedMode] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [ballPosition, setBallPosition] = useState({ x: 0, y: 0 });
  const [ballVelocity, setBallVelocity] = useState({ x: 0, y: 0 });
  const [paddlePosition, setPaddlePosition] = useState(0);
  const [bricks, setBricks] = useState([]);
  const gameAreaRef = useRef(null);
  const gameLoopRef = useRef(null);
  const keysPressed = useRef({});

  const gameModes = [
    {
      id: 'classic',
      title: '常规模式',
      icon: <Play className="w-8 h-8" />,
      description: '玩家拥有三条命，需控制小球在不掉落的情况下击打并消除屏幕上的全部砖块，共有10关，支持空格发射小球，使用左右方向键调整挡板的位置'
    },
    {
      id: 'timed',
      title: '限时模式',
      icon: <Clock className="w-8 h-8" />,
      description: '玩家拥有无限生命，需要在规定的时间内完成所有砖块的击打和消除，共有10关，通常使用鼠标移动控制挡板左右移动'
    },
    {
      id: 'crazy',
      title: '疯狂模式',
      icon: <Zap className="w-8 h-8" />,
      description: '玩家拥有三条命，需控制小球击打并消除所有砖块，在每一关的游戏过程中，小球的速度会不断变快，共有10关'
    },
    {
      id: 'endless',
      title: '无尽模式',
      icon: <InfinityIcon className="w-8 h-8" />,
      description: '需完成常规、限时、疯狂三种模式的所有关卡后才能解锁，游戏没有明确的关卡限制和结束条件，目标是尽可能长时间地存活并消除更多的砖块'
    }
  ];

  // 初始化游戏
  const initGame = () => {
    if (!gameAreaRef.current) return;

    const gameArea = gameAreaRef.current;
    const { width, height } = gameArea.getBoundingClientRect();

    // 初始化球的位置
    setBallPosition({
      x: width / 2,
      y: height - 50
    });

    // 初始化球的速度
    setBallVelocity({
      x: 0,
      y: 0
    });

    // 初始化挡板位置
    setPaddlePosition(width / 2 - 50);

    // 初始化砖块
    const brickRows = 5;
    const brickCols = 10;
    const brickWidth = width / brickCols - 2;
    const brickHeight = 20;
    const newBricks = [];

    for (let row = 0; row < brickRows; row++) {
      for (let col = 0; col < brickCols; col++) {
        newBricks.push({
          x: col * (brickWidth + 2),
          y: row * (brickHeight + 2) + 30,
          width: brickWidth,
          height: brickHeight,
          visible: true
        });
      }
    }

    setBricks(newBricks);
    setGameStarted(false);
  };

  // 开始游戏
  const startGame = () => {
    setBallVelocity({
      x: 3,
      y: -3
    });
    setGameStarted(true);
  };

  // 游戏循环
  const gameLoop = () => {
    if (!gameAreaRef.current || !gameStarted) return;

    const gameArea = gameAreaRef.current;
    const { width, height } = gameArea.getBoundingClientRect();
    const paddleWidth = 100;
    const ballRadius = 10;

    // 更新球的位置
    setBallPosition(prev => ({
      x: prev.x + ballVelocity.x,
      y: prev.y + ballVelocity.y
    }));

    // 边界检测
    if (ballPosition.x + ballRadius > width || ballPosition.x - ballRadius < 0) {
      setBallVelocity(prev => ({ ...prev, x: -prev.x }));
    }

    if (ballPosition.y - ballRadius < 0) {
      setBallVelocity(prev => ({ ...prev, y: -prev.y }));
    }

    // 球掉落检测
    if (ballPosition.y + ballRadius > height) {
      setLives(prev => prev - 1);
      if (lives - 1 <= 0) {
        // 游戏结束
        setGameStarted(false);
        setCurrentScreen('mode-detail');
      } else {
        // 重置球
        setBallPosition({
          x: width / 2,
          y: height - 50
        });
        setBallVelocity({
          x: 0,
          y: 0
        });
        setGameStarted(false);
      }
    }

    // 挡板碰撞检测
    if (
      ballPosition.y + ballRadius > height - 20 &&
      ballPosition.x > paddlePosition &&
      ballPosition.x < paddlePosition + paddleWidth
    ) {
      const hitPosition = (ballPosition.x - paddlePosition) / paddleWidth;
      const angle = (hitPosition - 0.5) * Math.PI / 3;
      setBallVelocity({
        x: 5 * Math.sin(angle),
        y: -5 * Math.cos(angle)
      });
    }

    // 砖块碰撞检测
    setBricks(prevBricks => {
      const newBricks = [...prevBricks];
      let bricksLeft = 0;

      for (let i = 0; i < newBricks.length; i++) {
        const brick = newBricks[i];
        if (!brick.visible) continue;

        bricksLeft++;

        if (
          ballPosition.x + ballRadius > brick.x &&
          ballPosition.x - ballRadius < brick.x + brick.width &&
          ballPosition.y + ballRadius > brick.y &&
          ballPosition.y - ballRadius < brick.y + brick.height
        ) {
          brick.visible = false;
          setScore(prev => prev + 10);
          setBallVelocity(prev => ({ ...prev, y: -prev.y }));
          break;
        }
      }

      // 关卡完成
      if (bricksLeft === 0) {
        setLevel(prev => {
          if (prev >= 10) {
            // 游戏通关
            setCurrentScreen('mode-detail');
            return prev;
          }
          return prev + 1;
        });
        initGame();
      }

      return newBricks;
    });

    // 处理键盘输入
    if (keysPressed.current['ArrowLeft']) {
      setPaddlePosition(prev => Math.max(0, prev - 10));
    }
    if (keysPressed.current['ArrowRight']) {
      setPaddlePosition(prev => Math.min(width - paddleWidth, prev + 10));
    }
  };

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
      if (e.code === 'Space' && !gameStarted) {
        startGame();
      }
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted]);

  // 游戏循环设置
  useEffect(() => {
    gameLoopRef.current = setInterval(gameLoop, 16);
    return () => clearInterval(gameLoopRef.current);
  }, [ballPosition, ballVelocity, paddlePosition, bricks, gameStarted]);

  // 初始化游戏
  useEffect(() => {
    if (currentScreen === 'game') {
      initGame();
    }
  }, [currentScreen, level]);

  const renderMainScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 text-white p-4">
      <motion.h1 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-5xl font-bold mb-8"
      >
        打砖块游戏
      </motion.h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {gameModes.map((mode) => (
          <motion.div
            key={mode.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 cursor-pointer border border-white/20"
            onClick={() => {
              setSelectedMode(mode.id);
              setCurrentScreen('mode-detail');
            }}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">{mode.icon}</div>
              <h2 className="text-2xl font-semibold">{mode.title}</h2>
            </div>
            <p className="mt-3 text-white/80">{mode.description}</p>
          </motion.div>
        ))}
      </div>
      <div className="flex gap-4 mt-12">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full"
        >
          <Trophy className="w-5 h-5" />排行榜
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full"
        >
          <Settings className="w-5 h-5" />设置
        </motion.button>
      </div>
    </div>
  );

  const renderModeDetail = () => {
    const mode = gameModes.find(m => m.id === selectedMode);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 text-white p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-4xl"
        >
          <button 
            onClick={() => setCurrentScreen('main')}
            className="flex items-center gap-2 mb-8 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />返回
          </button>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/20 rounded-full">{mode?.icon}</div>
              <h2 className="text-3xl font-bold">{mode?.title}</h2>
            </div>
            <p className="mb-8 text-lg">{mode?.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
                <motion.div
                  key={level}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="aspect-square flex items-center justify-center bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
                  onClick={() => {
                    setLevel(level);
                    setCurrentScreen('game');
                  }}
                >
                  {level}
                </motion.div>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-4 bg-blue-600 rounded-lg font-semibold text-lg"
              onClick={() => {
                setLevel(1);
                setCurrentScreen('game');
              }}
            >
              开始游戏
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderGameScreen = () => (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          ref={gameAreaRef}
          className="w-full max-w-2xl h-3/4 bg-gray-800 rounded-lg border-2 border-gray-700 relative overflow-hidden"
        >
          {/* 砖块 */}
          {bricks.map((brick, index) => (
            brick.visible && (
              <div 
                key={index}
                className="absolute bg-red-500 rounded-sm"
                style={{
                  left: `${brick.x}px`,
                  top: `${brick.y}px`,
                  width: `${brick.width}px`,
                  height: `${brick.height}px`
                }}
              />
            )
          ))}

          {/* 挡板 */}
          <div 
            className="absolute bg-white rounded-full"
            style={{
              left: `${paddlePosition}px`,
              bottom: '20px',
              width: '100px',
              height: '10px'
            }}
          />

          {/* 球 */}
          <div 
            className="absolute bg-white rounded-full"
            style={{
              left: `${ballPosition.x - 10}px`,
              top: `${ballPosition.y - 10}px`,
              width: '20px',
              height: '20px'
            }}
          />

          {/* 游戏提示 */}
          {!gameStarted && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <p className="text-2xl mb-4">按空格键开始游戏</p>
                <p>使用左右方向键移动挡板</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md p-4 rounded-lg">
        <div className="flex gap-8">
          <div>
            <p className="text-white/80">分数</p>
            <p className="text-2xl font-bold text-white">{score}</p>
          </div>
          <div>
            <p className="text-white/80">生命</p>
            <p className="text-2xl font-bold text-white">{lives}</p>
          </div>
          <div>
            <p className="text-white/80">关卡</p>
            <p className="text-2xl font-bold text-white">{level}/10</p>
          </div>
        </div>
      </div>
      <button 
        className="absolute top-4 right-4 bg-white/10 backdrop-blur-md p-3 rounded-full text-white"
        onClick={() => setCurrentScreen('mode-detail')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  );

  switch (currentScreen) {
    case 'main':
      return renderMainScreen();
    case 'mode-detail':
      return renderModeDetail();
    case 'game':
      return renderGameScreen();
    default:
      return renderMainScreen();
  }
};

export default BrickBreakerGame;