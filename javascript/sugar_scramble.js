
var highScores = JSON.parse(localStorage.getItem("highScores")) || [];

showScores();

var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  canvas: document.getElementById("game-canvas"),
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

var iter = 0;
var bgSpeed = 0.01;

var player;
var donuts;
var brocs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var GameOverText;
var candy;
var clouds;

var game = new Phaser.Game(config);

function preload() {
  this.load.image("cloud", "assets/clouds.png");
  this.load.image("sky", "assets/sky4.png");
  this.load.image("ground", "assets/plat3.png");
  this.load.image("donut", "assets/donut.png");
  this.load.image("candy", "assets/candy.png");
  this.load.image("broc", "assets/broc.png");
  this.load.spritesheet("dude", "assets/dude-cute.png", {
    frameWidth: 32,
    frameHeight: 48,
  });
  this.load.audio("jump", "assets/jump.wav");
  this.load.audio("coin", "assets/coin.wav");
  this.load.audio("bonus", "assets/bonus.wav");
  this.load.audio("death", "assets/death.wav");
  this.load.audio("bgmusic", "assets/bgmusic.mp3");
  this.load.image("jump1", "assets/jump1.png")
}

function create() {
  //  A simple background for our game
  this.add.image(400, 300, "sky");

  // Clouds
  clouds = this.add.image(-125, 150, "cloud");

  //  The platforms group contains the ground and the 2 ledges we can jump on
  platforms = this.physics.add.staticGroup();

  //  Here we create the ground.
  //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
  platforms.create(400, 568, "ground").setScale(2).refreshBody();

  //  Now let's create some ledges
  platforms.create(600, 400, "ground");
  platforms.create(50, 250, "ground");
  platforms.create(750, 220, "ground");

  // The player and its settings
  player = this.physics.add.sprite(100, 450, "dude");

  //  Player physics properties. Give the little guy a slight bounce.
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  // Sound effects
  jump = this.sound.add("jump", { loop: false });
  coin = this.sound.add("coin", { loop: false });
  bonus = this.sound.add("bonus", { loop: false });
  death = this.sound.add("death", { loop: false });
  bgmusic = this.sound.add("bgmusic", { loop: true });
  bgmusic.play();
  bgmusic.volume = 0.1;

  //  Our player animations, turning, walking left and walking right.
  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 4 }],
    frameRate: 20,
  });

  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  //  Input Events
  cursors = this.input.keyboard.createCursorKeys();

  //  Some donuts to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
  donuts = this.physics.add.group({
    key: "donut",
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 },
  });

  candy = this.physics.add.group({
    key: "candy",
    repeat: 0,
    setXY: { x: Phaser.Math.Between(1, 800), y: 0 },
  });

  candy.children.iterate(function (child) {
    //  Give each donut a slightly different bounce
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  donuts.children.iterate(function (child) {
    //  Give each donut a slightly different bounce
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  brocs = this.physics.add.group();
  var broc = brocs.create(x, 16, "broc");
  broc.setBounce(1);
  broc.setCollideWorldBounds(true);
  broc.setVelocity(Phaser.Math.Between(-200, 200), 20);
  broc.allowGravity = false;

  //  The score
  scoreText = this.add.text(700, 16, "0", {
    fontFamily: "Orbitron",
    fontSize: "32px",
    fill: "#000",
  });

  // game over text
   GameOverText = this.add.text(400, 300, "Game Over", {
    fontFamily: "Orbitron",
    fontSize: "32px",
    fill: "#000",
  })
  GameOverText.setOrigin(0.5)
  GameOverText.visible = false

  //  Collide the player and the donuts with the platforms
  this.physics.add.collider(player, platforms);
  this.physics.add.collider(donuts, platforms);
  this.physics.add.collider(candy, platforms);
  this.physics.add.collider(brocs, platforms);

  //  Checks to see if the player overlaps with any of the donuts, if he does call the collectCandy function
  this.physics.add.overlap(player, donuts, collectDonut, null, this);
  this.physics.add.overlap(player, candy, collectCandy, null, this);
  this.physics.add.collider(player, brocs, hitBomb, null, this);

  var x =
    player.x < 400
      ? Phaser.Math.Between(400, 800)
      : Phaser.Math.Between(0, 400);

}

function toggleMusic() {
  if (bgmusic.isPlaying) {
    bgmusic.pause();
  } else {
    bgmusic.play();
  }
}


// main loop
function update() {
  if (gameOver) {
    return;
  }

  moveCloud(clouds, 0.15);

  if (cursors.left.isDown) {
    player.setVelocityX(-160);
    player.anims.play("left", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
    player.anims.play("right", true);
  } else {
    player.setVelocityX(0)
    player.anims.play("turn");
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330);
    jump.play();
    jump.volume = 0.1;
  }


}

function collectCandy(player, candy) {
  candy.disableBody(true, true);
  bonus.volume = 2; 
  bonus.play();
  //  Add and update the score
  score += 50;
  scoreText.setText(score);
  scoreText.setColor("yellow");
}

function collectDonut(player, donut) {
  donut.disableBody(true, true);
  coin.play();
  coin.volume = 0.1;
  //  Add and update the score
  score += 10;
  scoreText.setText(score);
  scoreText.setColor("black");

  if (donuts.countActive(true) === 0) {
    //  A new batch of donuts to collect
    donuts.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });

    candy.children.iterate(function (child) {
      //  Give each donut a slightly different bounce
      child.enableBody(true, Phaser.Math.Between(1, 800), 0, true, true);
    });

    var x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);

    var broc = brocs.create(x, 16, "broc");
    broc.setBounce(1);
    broc.setCollideWorldBounds(true);
    broc.setVelocity(Phaser.Math.Between(-200, 200), 20);
    broc.allowGravity = false;
  }
}

function hitBomb(player, bomb) {
  this.physics.pause();
  death.play();
  death.volume = 0.1;
  bgmusic.pause();
  player.setTint(0xff0000);
  player.anims.play("turn");
  gameOver = true;
  // shows game over text
  GameOverText.visible = true


  var highestScore = highScores[0] || 0;

  if (score !== 0 && highestScore < score) {
    highScores.push(score);
  }

  localStorage.setItem(
    "highScores",
    JSON.stringify(highScores.sort((a, b) => b - a))
  );
  showScores();
}

function clearHighScores() {
  localStorage.setItem("highScores", "[]");
  showScores();
}

function showScores() {
  let allHighScores = JSON.parse(localStorage.getItem("highScores")) || [];

  let scoreListItems = allHighScores
    .map((score) => `<li>${score}</li>`)
    .join("");

  document.getElementById(
    "scores"
  ).innerHTML = `<ol>${scoreListItems}</ol>`;
}

function moveCloud(cloud, speed) {
  // increase the position of the clouds on the horizontal axis
  cloud.x += speed;
  // when the cloud leaves the view, reset to 0
  if (cloud.x > config.width + 200) {
    // 2.1 call a reset position function
    cloud.x = -125;
  }
}