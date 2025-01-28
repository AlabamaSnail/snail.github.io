const GameElements = {
    Platform: class {
        constructor(x, y, width, height) {
            this.type = 'platform';
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.solid = true;
        }
    },

    MovingPlatform: class {
        constructor(x, y, width, height) {
            this.type = 'movingPlatform';
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.startX = x;
            this.startY = y;
            this.moveDistance = 200;
            this.speed = 2;
            this.direction = 1;
        }
    },

    Enemy: class {
        constructor(x, y) {
            this.type = 'enemy';
            this.x = x;
            this.y = y;
            this.width = 32;
            this.height = 32;
            this.enemyType = 'basic'; // basic, flying, charging
            this.patrolDistance = 100;
            this.speed = 2;
        }
    },

    PowerUp: class {
        constructor(x, y) {
            this.type = 'powerup';
            this.x = x;
            this.y = y;
            this.width = 24;
            this.height = 24;
            this.powerType = 'doubleJump'; // doubleJump, speedBoost, invincibility
        }
    }
}; 