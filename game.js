let scene, camera, renderer;
let isJumping = false;
let score = 0;
let obstacles = [];

// 修改自动移动速度为更慢的值
const AUTO_MOVE_SPEED = 0.15;
let currentSpeed = AUTO_MOVE_SPEED;
let gameStarted = false;

// 添加跑道相关变量
let track;
let trackSegments = [];
const TRACK_WIDTH = 10;
const SEGMENT_LENGTH = 50;
const SEGMENTS_TO_RENDER = 4;

// 修改moveState，移除前后移动状态
let moveState = {
    left: false,
    right: false
};

// 添加游戏状态变量
let gameOver = false;

// 添加场景元素变量
let ground, lake;

// 添加新的场景元素变量
let skybox;
let trees = [];
let mountains = [];
let clouds = [];
let flowers = [];
let rocks = [];

// 添加跳跃相关变量
let jumpCount = 0;  // 记录跳跃次数
const MAX_JUMPS = 2;  // 最大跳跃次数
let currentJumpAnimation = null;  // 当前跳跃动画

// 添加金币相关变量
let coins = [];
const COIN_VALUE = 30; // 降低单个金币的价值，因为金币更多了

// 在init函数中添加金币材质
let coinGeometry, coinMaterial;

// 添加重新开始按钮创建函数
function createRestartButton() {
    const restartButton = document.createElement('button');
    restartButton.id = 'restartButton';
    restartButton.innerHTML = '重新开始';
    restartButton.style.position = 'fixed';
    restartButton.style.top = '50%';
    restartButton.style.left = '50%';
    restartButton.style.transform = 'translate(-50%, 50px)';
    restartButton.style.padding = '10px 20px';
    restartButton.style.fontSize = '20px';
    restartButton.style.backgroundColor = '#4CAF50';
    restartButton.style.color = 'white';
    restartButton.style.border = 'none';
    restartButton.style.borderRadius = '5px';
    restartButton.style.cursor = 'pointer';
    restartButton.style.display = 'none';
    
    restartButton.addEventListener('click', restartGame);
    document.body.appendChild(restartButton);
    return restartButton;
}

// 添加游戏结束消息创建函数
function createGameOverMessage() {
    const gameOverMessage = document.createElement('div');
    gameOverMessage.id = 'gameOverMessage';
    gameOverMessage.style.position = 'fixed';
    gameOverMessage.style.top = '50%';
    gameOverMessage.style.left = '50%';
    gameOverMessage.style.transform = 'translate(-50%, -50%)';
    gameOverMessage.style.color = 'white';
    gameOverMessage.style.fontSize = '32px';
    gameOverMessage.style.textAlign = 'center';
    gameOverMessage.style.display = 'none';
    document.body.appendChild(gameOverMessage);
    return gameOverMessage;
}

// 添加重新开始游戏函数
function restartGame() {
    // 重置游戏状态
    score = 0;
    currentSpeed = AUTO_MOVE_SPEED;
    gameStarted = true;
    gameOver = false;
    
    // 重置相机位置
    camera.position.set(0, 1.7, 0);
    
    // 清除所有障碍物
    obstacles.forEach(obstacle => scene.remove(obstacle));
    obstacles = [];
    
    // 清除所有跑道段落
    trackSegments.forEach(segment => scene.remove(segment));
    trackSegments = [];
    
    // 重新初始化跑道
    initTrack();
    
    // 重置地面和湖泊位置
    ground.position.z = -100;
    lake.position.z = -50;
    
    // 重置树木位置
    trees.forEach(tree => {
        const x = Math.random() * 200 - 100;
        const z = Math.random() * 200 - 100;
        tree.position.set(x, 0, z);
    });

    // 重置山脉位置
    mountains.forEach((mountain, i) => {
        const x = Math.random() * 400 - 200;
        const z = -150 - Math.random() * 100;
        mountain.position.set(x, 0, z);
    });
    
    // 重置跳跃相关状态
    isJumping = false;
    jumpCount = 0;
    if(currentJumpAnimation) {
        cancelAnimationFrame(currentJumpAnimation);
        currentJumpAnimation = null;
    }
    
    // 清除所有金币
    coins.forEach(coin => scene.remove(coin));
    coins = [];
    
    // 重置云朵位置
    clouds.forEach(cloud => {
        const x = Math.random() * 200 - 100;
        const y = 20 + Math.random() * 10;
        const z = Math.random() * 200 - 100;
        cloud.position.set(x, y, z);
    });

    // 重置花朵和岩石位置
    [...flowers, ...rocks].forEach(object => {
        const x = Math.random() * 200 - 100;
        const z = Math.random() * 200 - 100;
        if(Math.abs(x) < TRACK_WIDTH + 2) {
            object.position.x = (TRACK_WIDTH + 2) * (Math.random() > 0.5 ? 1 : -1);
        }
        object.position.set(x, object.position.y, z);
    });
    
    // 隐藏游戏结束界面
    document.getElementById('gameOverMessage').style.display = 'none';
    document.getElementById('restartButton').style.display = 'none';
}

// 初始化场景
function init() {
    // 创建场景
    scene = new THREE.Scene();
    
    // 创建第一人称相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.7, 0); // 设置相机高度接近人眼高度
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // 创建地面
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x228B22,
        side: THREE.DoubleSide 
    });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    ground.position.z = -100;
    scene.add(ground);
    
    // 创建湖泊
    const lakeGeometry = new THREE.CircleGeometry(40, 32);
    const lakeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x4169E1,
        side: THREE.DoubleSide 
    });
    lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
    lake.rotation.x = Math.PI / 2;
    lake.position.set(-30, 0.1, -50);
    scene.add(lake);
    
    // 初始化跑道
    initTrack();
    
    // 添加光源
    const light = new THREE.AmbientLight(0xffffff);
    scene.add(light);
    
    // 添加开始提示
    const startMessage = document.createElement('div');
    startMessage.id = 'startMessage';
    startMessage.style.position = 'fixed';
    startMessage.style.top = '50%';
    startMessage.style.left = '50%';
    startMessage.style.transform = 'translate(-50%, -50%)';
    startMessage.style.color = 'white';
    startMessage.style.fontSize = '24px';
    startMessage.style.textAlign = 'center';
    startMessage.innerHTML = '按空格键开始游戏<br>使用左右方向键移动<br>空格键跳跃（可二段跳）';
    document.body.appendChild(startMessage);

    // 创建游戏结束消息
    createGameOverMessage();
    
    // 创建重新开始按钮
    createRestartButton();

    // 添加天空盒
    const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const skyMaterials = [
        new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }), // 天蓝色
        new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide })
    ];
    skybox = new THREE.Mesh(skyGeometry, skyMaterials);
    scene.add(skybox);

    // 创建树木函数
    function createTree(x, z) {
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

        const leavesGeometry = new THREE.ConeGeometry(1.5, 3, 8);
        const leavesMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 2;

        const tree = new THREE.Group();
        tree.add(trunk);
        tree.add(leaves);
        tree.position.set(x, 0, z);
        scene.add(tree);
        return tree;
    }

    // 创建山脉函数
    function createMountain(x, z) {
        const mountainGeometry = new THREE.ConeGeometry(20, 30, 4);
        const mountainMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        mountain.position.set(x, 0, z);
        scene.add(mountain);
        return mountain;
    }

    // 在场景中添加树木
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 200 - 100;
        const z = Math.random() * 200 - 100;
        if (Math.abs(x) > TRACK_WIDTH) { // 确保树木不在跑道上
            trees.push(createTree(x, z));
        }
    }

    // 在远处添加山脉
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * 400 - 200;
        const z = -150 - Math.random() * 100;
        mountains.push(createMountain(x, z));
    }

    // 创建金币的通用几何体和材质（缩小尺寸）
    coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
    coinMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFD700,
        metalness: 1,
        roughness: 0.3,
    });

    // 创建云朵函数
    function createCloud(x, y, z) {
        const cloud = new THREE.Group();
        const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        
        // 创建多个球体组成一朵云
        for(let i = 0; i < 5; i++) {
            const radius = 1 + Math.random() * 0.5;
            const cloudPart = new THREE.Mesh(
                new THREE.SphereGeometry(radius, 8, 8),
                cloudMaterial
            );
            cloudPart.position.set(
                i * 1.5 - 3,
                Math.random() * 0.5,
                Math.random() * 0.5
            );
            cloud.add(cloudPart);
        }
        
        cloud.position.set(x, y, z);
        scene.add(cloud);
        clouds.push(cloud);
        return cloud;
    }

    // 创建花朵函数
    function createFlower(x, z) {
        const flower = new THREE.Group();
        
        // 花茎
        const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
        const stemMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        flower.add(stem);
        
        // 花瓣
        const petalGeometry = new THREE.CircleGeometry(0.2, 5);
        const colors = [0xFF69B4, 0xFFB6C1, 0xFFC0CB, 0xFF1493];
        const petalColor = colors[Math.floor(Math.random() * colors.length)];
        const petalMaterial = new THREE.MeshBasicMaterial({ 
            color: petalColor,
            side: THREE.DoubleSide
        });
        
        for(let i = 0; i < 6; i++) {
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            petal.position.y = 0.3;
            petal.rotation.y = (i / 6) * Math.PI * 2;
            petal.rotation.x = Math.PI / 4;
            flower.add(petal);
        }
        
        flower.position.set(x, 0, z);
        scene.add(flower);
        flowers.push(flower);
        return flower;
    }

    // 创建岩石函数
    function createRock(x, z) {
        const rockGeometry = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5);
        const rockMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x808080 + Math.random() * 0x202020 
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        rock.position.set(x, 0.25, z);
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        scene.add(rock);
        rocks.push(rock);
        return rock;
    }

    // 添加云朵
    for(let i = 0; i < 10; i++) {
        const x = Math.random() * 200 - 100;
        const y = 20 + Math.random() * 10;
        const z = Math.random() * 200 - 100;
        createCloud(x, y, z);
    }

    // 添加花朵（只在跑道外）
    for(let i = 0; i < 50; i++) {
        const x = Math.random() * 200 - 100;
        const z = Math.random() * 200 - 100;
        if(Math.abs(x) > TRACK_WIDTH + 2) {
            createFlower(x, z);
        }
    }

    // 添加岩石（只在跑道外）
    for(let i = 0; i < 30; i++) {
        const x = Math.random() * 200 - 100;
        const z = Math.random() * 200 - 100;
        if(Math.abs(x) > TRACK_WIDTH + 1) {
            createRock(x, z);
        }
    }

    // 修改键盘事件监听
    document.addEventListener('keydown', (event) => {
        if (gameOver && event.key === 'r') {
            restartGame();
            return;
        }
        
        if (!gameStarted && event.key === ' ') {
            gameStarted = true;
            startMessage.style.display = 'none';
            return;
        }
        
        handleKeyDown(event);
    });
    document.addEventListener('keyup', handleKeyUp);
}

// 修改update函数中的跑道更新逻辑
function update() {
    if (!gameStarted || gameOver) return;

    // 自动向前移动
    camera.position.z -= currentSpeed;
    
    // 更新地面和湖泊位置
    const cameraZSection = Math.floor(camera.position.z / 100) * 100;
    ground.position.z = cameraZSection;
    lake.position.z = cameraZSection;
    
    score += 1;
    document.getElementById('score').textContent = '分数: ' + score;
    
    // 处理左右移动
    const sideSpeed = currentSpeed * 0.8; // 降低左右移动速度
    if (moveState.left) {
        camera.position.x = Math.max(camera.position.x - sideSpeed, -TRACK_WIDTH/2 + 1);
    }
    if (moveState.right) {
        camera.position.x = Math.min(camera.position.x + sideSpeed, TRACK_WIDTH/2 + 1);
    }

    // 更新跑道段落
    const playerZ = camera.position.z;
    
    // 检查是否需要生成新的跑道段落
    const lastSegment = trackSegments[trackSegments.length - 1];
    if (!lastSegment || (playerZ < lastSegment.position.z)) {
        const newSegmentZ = lastSegment ? 
            lastSegment.position.z - SEGMENT_LENGTH : 
            playerZ - SEGMENT_LENGTH;
        
        const newSegment = createTrackSegment(newSegmentZ);
        trackSegments.push(newSegment);
    }
    
    // 移除远处的跑道段落和障碍物
    for (let i = trackSegments.length - 1; i >= 0; i--) {
        const segment = trackSegments[i];
        if (segment.position.z > playerZ + SEGMENT_LENGTH * 3) {
            scene.remove(segment);
            trackSegments.splice(i, 1);
        }
    }

    // 更新和清理障碍物
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        // 检查碰撞
        const distance = Math.sqrt(
            Math.pow(obstacle.position.x - camera.position.x, 2) +
            Math.pow(obstacle.position.z - camera.position.z, 2)
        );
        
        if (distance < 1 && !isJumping) {
            gameOver = true;
            const gameOverMessage = document.getElementById('gameOverMessage');
            gameOverMessage.innerHTML = `游戏结束！<br>得分: ${score}`;
            gameOverMessage.style.display = 'block';
            document.getElementById('restartButton').style.display = 'block';
            return;
        }
        
        // 移除远处的障碍物
        if (obstacle.position.z > playerZ + SEGMENT_LENGTH * 3) {
            scene.remove(obstacle);
            obstacles.splice(i, 1);
        }
    }

    // 更新天空盒位置
    skybox.position.z = camera.position.z;
    
    // 更新树木位置
    trees.forEach((tree, index) => {
        if (tree.position.z > camera.position.z + 100) {
            // 将树木移动到玩家前方
            tree.position.z = camera.position.z - 200;
            tree.position.x = Math.random() * 200 - 100;
            if (Math.abs(tree.position.x) < TRACK_WIDTH) {
                tree.position.x = TRACK_WIDTH * (Math.random() > 0.5 ? 1.5 : -1.5);
            }
        }
    });

    // 更新山脉位置
    mountains.forEach((mountain, index) => {
        if (mountain.position.z > camera.position.z + 100) {
            // 将山脉移动到玩家前方
            mountain.position.z = camera.position.z - 300;
            mountain.position.x = Math.random() * 400 - 200;
        }
    });

    // 更新金币
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        
        // 旋转动画
        coin.rotation.z += 0.02;
        
        // 上下浮动动画（减小浮动幅度）
        coin.position.y = 1.3 + Math.sin(Date.now() * 0.003) * 0.05;
        
        // 检查收集
        if (!coin.collected) {
            const distance = Math.sqrt(
                Math.pow(coin.position.x - camera.position.x, 2) +
                Math.pow(coin.position.z - camera.position.z, 2)
            );
            
            if (distance < 1) {
                coin.collected = true;
                score += COIN_VALUE;
                document.getElementById('score').textContent = '分数: ' + score;
                
                // 收集动画
                const coinAnimation = {
                    scale: 1,
                    opacity: 1
                };
                
                function animateCoinCollection() {
                    coinAnimation.scale *= 1.2;
                    coinAnimation.opacity *= 0.8;
                    
                    coin.scale.set(coinAnimation.scale, coinAnimation.scale, coinAnimation.scale);
                    coin.material.opacity = coinAnimation.opacity;
                    
                    if (coinAnimation.opacity > 0.1) {
                        requestAnimationFrame(animateCoinCollection);
                    } else {
                        scene.remove(coin);
                        coins.splice(i, 1);
                    }
                }
                
                coin.material = coin.material.clone();
                coin.material.transparent = true;
                animateCoinCollection();
            }
        }
        
        // 移除远处的金币
        if (coin.position.z > playerZ + SEGMENT_LENGTH * 3) {
            scene.remove(coin);
            coins.splice(i, 1);
        }
    }

    // 更新云朵位置
    clouds.forEach((cloud, index) => {
        // 让云朵缓慢移动
        cloud.position.x += Math.sin(Date.now() * 0.0001 + index) * 0.01;
        
        if(cloud.position.z > camera.position.z + 100) {
            cloud.position.z = camera.position.z - 200;
            cloud.position.x = Math.random() * 200 - 100;
        }
    });

    // 更新花朵和岩石
    [...flowers, ...rocks].forEach((object) => {
        if(object.position.z > camera.position.z + 100) {
            object.position.z = camera.position.z - 200;
            object.position.x = (Math.random() * 200 - 100);
            // 确保不在跑道上
            if(Math.abs(object.position.x) < TRACK_WIDTH + 2) {
                object.position.x = (TRACK_WIDTH + 2) * (Math.random() > 0.5 ? 1 : -1);
            }
        }
    });
}

// 修改createTrackSegment函数中的金币生成部分
function createTrackSegment(zPosition) {
    const segmentGeometry = new THREE.BoxGeometry(TRACK_WIDTH, 0.5, SEGMENT_LENGTH);
    const segmentMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
    const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
    
    segment.position.set(0, 0.25, zPosition);
    scene.add(segment);
    
    // 增加障碍物数量
    const obstacleCount = Math.floor(Math.random() * 3) + 2; // 2-4个障碍物
    const zoneLength = SEGMENT_LENGTH / obstacleCount;
    
    // 创建障碍物
    for (let i = 0; i < obstacleCount; i++) {
        // 增加组合障碍物的出现概率
        const isGroup = Math.random() < 0.3; // 30%概率生成组合障碍物
        
        if (isGroup) {
            // 组合障碍物
            const groupCount = Math.floor(Math.random() * 2) + 2; // 2-3个障碍物一组
            const spacing = 1.8; // 稍微减小间距
            
            // 随机选择组合类型
            const groupType = Math.random();
            if (groupType < 0.5) {
                // 横向排列
                for (let j = 0; j < groupCount; j++) {
                    const obstacle = createObstacle();
                    const zoneStart = zPosition - (i * zoneLength);
                    const zoneEnd = zPosition - ((i + 1) * zoneLength);
                    
                    obstacle.position.x = (j * spacing) - (spacing * (groupCount - 1) / 2);
                    obstacle.position.z = Math.random() * (zoneEnd - zoneStart) + zoneStart;
                    obstacle.position.y = 1;
                }
            } else {
                // 斜向排列
                for (let j = 0; j < groupCount; j++) {
                    const obstacle = createObstacle();
                    const zoneStart = zPosition - (i * zoneLength);
                    const zoneEnd = zPosition - ((i + 1) * zoneLength);
                    
                    const angle = Math.PI / 4; // 45度角
                    obstacle.position.x = (j * spacing * Math.cos(angle)) - (spacing * (groupCount - 1) / 2);
                    obstacle.position.z = (Math.random() * (zoneEnd - zoneStart) + zoneStart) + (j * spacing * Math.sin(angle));
                    obstacle.position.y = 1;
                }
            }
        } else {
            // 单个障碍物
            const obstacle = createObstacle();
            const zoneStart = zPosition - (i * zoneLength);
            const zoneEnd = zPosition - ((i + 1) * zoneLength);
            
            obstacle.position.x = (Math.random() * (TRACK_WIDTH - 3)) - (TRACK_WIDTH/2 - 1.5);
            obstacle.position.z = Math.random() * (zoneEnd - zoneStart) + zoneStart;
            obstacle.position.y = 1;
        }
    }
    
    // 增加金币生成
    const coinCount = Math.floor(Math.random() * 5) + 5; // 5-9个金币
    const coinZoneLength = SEGMENT_LENGTH / coinCount;
    
    for (let i = 0; i < coinCount; i++) {
        const zoneStart = zPosition - (i * coinZoneLength);
        const zoneEnd = zPosition - ((i + 1) * coinZoneLength);
        
        // 增加金币组的概率和种类
        const groupType = Math.random();
        if (groupType < 0.6) { // 60%概率生成金币组
            const pattern = Math.random();
            if (pattern < 0.4) {
                // 横向一排3个金币
                const groupWidth = 3;
                const spacing = 1.2;
                for (let j = 0; j < groupWidth; j++) {
                    const coinX = ((j - 1) * spacing) + (Math.random() * 0.3 - 0.15);
                    const coinZ = Math.random() * (zoneEnd - zoneStart) + zoneStart;
                    createCoin(coinX, coinZ);
                }
            } else if (pattern < 0.7) {
                // 斜线5个金币
                const groupSize = 5;
                const spacing = 1.0;
                for (let j = 0; j < groupSize; j++) {
                    const coinX = ((j - 2) * spacing) + (Math.random() * 0.2 - 0.1);
                    const coinZ = zoneStart + (j * spacing) + (Math.random() * 0.2 - 0.1);
                    createCoin(coinX, coinZ);
                }
            } else {
                // 竖直一列3个金币
                const groupHeight = 3;
                const spacing = 1.0;
                const baseX = (Math.random() * (TRACK_WIDTH - 2)) - (TRACK_WIDTH/2 - 1);
                const baseZ = Math.random() * (zoneEnd - zoneStart) + zoneStart;
                for (let j = 0; j < groupHeight; j++) {
                    createCoin(baseX, baseZ);
                }
            }
        } else {
            // 创建2个分散的单个金币
            for (let j = 0; j < 2; j++) {
                const coinX = (Math.random() * (TRACK_WIDTH - 3)) - (TRACK_WIDTH/2 - 1.5);
                const coinZ = Math.random() * (zoneEnd - zoneStart) + zoneStart;
                createCoin(coinX, coinZ);
            }
        }
    }
    
    return segment;
}

// 修改initTrack函数
function initTrack() {
    // 在玩家前方生成初始跑道段落
    let currentZ = 0;
    for (let i = 0; i < SEGMENTS_TO_RENDER + 2; i++) { // 增加初始段落数量
        const segment = createTrackSegment(currentZ - SEGMENT_LENGTH * i);
        trackSegments.push(segment);
    }
}

// 修改createObstacle函数，让障碍物更显眼
function createObstacle() {
    const types = [
        { geometry: new THREE.BoxGeometry(1, 2, 1), color: 0xFF0000 },        // 红色
        { geometry: new THREE.CylinderGeometry(0.5, 0.5, 2), color: 0xFF4500 }, // 橙红色
        { geometry: new THREE.BoxGeometry(2, 1, 1), color: 0xFF6347 },        // 番茄红
        { geometry: new THREE.SphereGeometry(0.7), color: 0xDC143C }         // 深红色
    ];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const obstacleMaterial = new THREE.MeshBasicMaterial({ 
        color: type.color,
        // 增加发光效果
        emissive: type.color,
        emissiveIntensity: 0.5,
        // 移除透明效果使颜色更纯正
        transparent: false,
        // 添加边框
        wireframe: false,
        // 添加光泽
        shininess: 100
    });
    const obstacle = new THREE.Mesh(type.geometry, obstacleMaterial);
    
    // 添加发光边框
    const edgesGeometry = new THREE.EdgesGeometry(obstacle.geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ 
        color: 0xFFFFFF,
        linewidth: 2
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    obstacle.add(edges);
    
    // 减少旋转，只在Y轴上旋转
    obstacle.rotation.y = Math.random() * Math.PI * 2;
    
    scene.add(obstacle);
    obstacles.push(obstacle);
    return obstacle;
}

// 创建金币函数
function createCoin(x, z) {
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    coin.rotation.x = Math.PI / 2; // 使金币平放
    coin.position.set(x, 1.3, z); // 降低金币高度，从1.5改为1.3
    coin.collected = false;
    
    scene.add(coin);
    coins.push(coin);
    return coin;
}

// 修改键盘按下事件处理
function handleKeyDown(event) {
    switch(event.key) {
        case 'ArrowLeft':
            moveState.left = true;
            break;
        case 'ArrowRight':
            moveState.right = true;
            break;
        case ' ':
            if(!isJumping) {
                jump();
            }
            break;
    }
}

// 添加键盘释放事件处理
function handleKeyUp(event) {
    switch(event.key) {
        case 'ArrowLeft':
            moveState.left = false;
            break;
        case 'ArrowRight':
            moveState.right = false;
            break;
    }
}

// 修改跳跃功能
function jump() {
    // 放宽跳跃判定条件，增加最大高度限制
    if(jumpCount >= MAX_JUMPS || camera.position.y > 12) return;  // 增加最大高度限制
    
    // 如果有正在进行的跳跃动画，取消它
    if(currentJumpAnimation) {
        cancelAnimationFrame(currentJumpAnimation);
    }
    
    isJumping = true;
    jumpCount++;
    
    const initialY = camera.position.y;
    const jumpHeight = jumpCount === 1 ? 7 : 8;  // 大幅增加跳跃高度
    let jumpProgress = 0;
    const jumpSpeed = 0.06;  // 进一步降低跳跃速度，使跳跃更慢
    
    function animateJump() {
        if(jumpProgress >= Math.PI) {
            camera.position.y = 1.7;
            isJumping = false;
            
            // 放宽落地判定
            if(camera.position.y <= 1.8) {
                jumpCount = 0;
            }
            return;
        }
        
        jumpProgress += jumpSpeed;
        // 修改跳跃曲线，使下落更慢
        const height = Math.sin(jumpProgress) * (1 - Math.abs(Math.sin(jumpProgress)) * 0.15);
        camera.position.y = initialY + height * jumpHeight;
        currentJumpAnimation = requestAnimationFrame(animateJump);
    }
    
    animateJump();
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

// 初始化游戏
init();
animate();

// 处理窗口大小变化
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}); 