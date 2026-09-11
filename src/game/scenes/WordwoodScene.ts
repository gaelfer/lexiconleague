import * as Phaser from 'phaser';
import { frameWorld } from '../world/framing';
import Player from '../entities/Player';
import type { StoryAvatarConfig } from '../avatar';
import { CLUES, WORDS, checkWordwood, type Word } from '../story/wordwoodPuzzle';
import { getStoryProgress, saveStoryProgress } from '@/lib/story/progress';
import { grassTiles, villagePaths } from '../world/pixelTerrain';
import { leafCluster } from '../world/InkwellVillage';
import { drawGatehouse,enterGatehouse } from '../world/gatehouse';
import {openDoorAnimation} from '../world/doorOpening';
import { advanceEcho } from '../story/areaTravel';
import { wordwoodDetails } from '../world/wordwoodDetails';
import { markChapterComplete } from '@/lib/story/progress';

interface Site { x: number; y: number; label: string; action: () => void }

/** A quiet, interconnected exploration puzzle. All clues and signs remain reachable. */
export default class WordwoodScene extends Phaser.Scene {
  private player!: Player;
  private prompt!: Phaser.GameObjects.Text;
  private sites: Site[] = [];
  private words: Word[] = ['hollow', 'hollow', 'hollow'];
  private found = new Set<number>();
  private labels: Phaser.GameObjects.Text[] = [];
  private panel: Phaser.GameObjects.Container | null = null;
  private nextInput = 0;
  private solved = false;
  private gate!: Phaser.Physics.Arcade.Image;
  private gateArt!:Phaser.GameObjects.Graphics;
  private route!: Phaser.GameObjects.Graphics;
  private completed = false;
  private locked=false;
  private echoStep=0;
  private echoOpen=false;
  private lastStone=-1;
  private echoTiles:Phaser.GameObjects.Rectangle[]=[];
  private feedback!:Phaser.GameObjects.Text;
  private landmarkChanges!:Phaser.GameObjects.Graphics;

  constructor(private avatar: StoryAvatarConfig) { super({ key: 'WordwoodScene' }); }

  create() {
    this.locked=false;
    this.sites = []; this.labels = []; this.panel = null; this.completed = false;
    this.words=['hollow','hollow','hollow'];this.found=new Set();this.solved=false;
    this.echoStep=0;this.echoOpen=false;this.lastStone=-1;this.echoTiles=[];
    try {
      const saved = JSON.parse(getStoryProgress().chapterCheckpoints[2] || '{}');
      if (Array.isArray(saved.words) && saved.words.length === 3 && saved.words.every((w: Word) => WORDS.includes(w))) this.words = saved.words;
      if (Array.isArray(saved.found)) this.found = new Set(saved.found.filter((n: number) => Number.isInteger(n) && n >= 0 && n < 3));
      this.solved = saved.solved === true && checkWordwood(this.words) === null;
      this.echoOpen=this.solved&&(saved.echoOpen===true||getStoryProgress().completedChapters.includes(2));
      if(this.solved&&Number.isInteger(saved.echoStep)&&saved.echoStep>=0&&saved.echoStep<3)this.echoStep=saved.echoStep;
    } catch { /* Old checkpoint formats safely start a new puzzle. */ }
    this.physics.world.setBounds(0, 0, 1600, 1200);
    const walls = this.physics.add.staticGroup();
    const obstacle = (x: number, y: number, w: number, h: number) => {
      const body = this.physics.add.staticImage(x, y, '__DEFAULT').setVisible(false);
      body.setDisplaySize(w, h).refreshBody(); walls.add(body);
    };
    const g = this.add.graphics().setDepth(-20);
    grassTiles(g, 0, 0, 1600, 1200);
    // Paths make a loop around the central clearing; every clue is reachable in any order.
    villagePaths(g, [[256,320,64,576],[256,256,1088,64],[1280,320,64,576],
      [256,896,1088,64],[768,256,64,768],[256,576,1088,64]]);
    for (let sy = -64; sy <= 64; sy += 32) {
      for (let sx = -64; sx <= 64; sx += 32) {
        if (sx * sx + sy * sy > 80 * 80) continue;
        g.fillStyle((sx + sy) % 48 ? 0x778672 : 0x88937b);
        g.fillRect(784 + sx, 594 + sy, 30, 30);
        g.fillStyle(0xa0aa8c).fillRect(785 + sx, 594 + sy, 27, 1);
      }
    }
    for (let x = 40; x < 1600; x += 80) {
      if(x<704||x>896){this.tree(g,x,80);obstacle(x,75,68,95);}
      this.tree(g, x, 1135);obstacle(x, 1150, 68, 60);
    }
    for (let y = 170; y < 1100; y += 85) {
      this.tree(g, 70, y); this.tree(g, 1530, y);
      obstacle(65, y, 65, 55); obstacle(1535, y, 65, 55);
    }
    for (const [x, y] of [[440, 440], [540, 790], [1090, 445], [1110, 790], [450, 1080], [1190, 1050]]) {
      this.tree(g, x, y); obstacle(x, y + 10, 40, 38);
    }
    // Three exhibits illustrate the meanings without requiring outside knowledge.
    g.fillStyle(0x496858).fillRect(128,408,256,112);
    g.fillStyle(0x31586a).fillRect(128,416,256,96);
    for(let y=422;y<512;y+=16){g.fillStyle(0x759790).fillRect(136+(y%32),y,68,2).fillRect(328,y+6,42,1);}
    g.fillStyle(0x433e32).fillRect(256,400,64,128);
    for(let y=402;y<528;y+=10){
      g.fillStyle(0xa7895e).fillRect(258,y,60,8);g.fillStyle(0xd4bb85).fillRect(258,y,58,1);
      g.fillStyle(0x756044).fillRect(279+(y%3)*7,y+2,1,5);
    }
    for(const x of [250,320]){g.fillStyle(0x5c4b37).fillRect(x,400,5,128);g.fillStyle(0xb6a073).fillRect(x,400,2,128);}
    g.fillStyle(0x76583b); g.fillRoundedRect(1210, 415, 225, 82, 35);
    g.fillStyle(0x15251f); g.fillEllipse(1223, 457, 49, 63);
    g.lineStyle(5, 0xb39a65); g.strokeEllipse(1223, 457, 49, 63);
    villagePaths(g,[[640,800,64,32],[672,768,64,32],[704,768,32,64],[704,800,64,32],[736,768,32,64],[768,768,32,32]]);
    for(let x=1256;x<1424;x+=16){g.fillStyle(0x4f4634).fillRect(x,432,2,43);g.fillStyle(0xb59460).fillRect(x+3,432,2,30);}

    this.route = this.add.graphics().setDepth(-10);
    wordwoodDetails(this,obstacle);
    this.landmarkChanges=this.add.graphics().setDepth(-9);
    villagePaths(g,[[640,1056,128,64],[736,928,64,192]]);
    drawGatehouse(this,656,1072,obstacle);
    this.add.image(608,768,'interior-desk').setDisplaySize(32,32).setOrigin(0).setDepth(2);obstacle(624,784,32,32);
    // The final gate spans the entire entrance to the little northern sanctuary.
    obstacle(384,144,768,32);obstacle(1216,144,768,32);
    for(let x=0;x<1600;x+=32)if(x<768||x>=832){g.fillStyle(0x435b4c).fillRect(x,128,32,32);g.fillStyle(0x8b9876).fillRect(x,128,32,3);}
    this.gate = this.physics.add.staticImage(800, 144, '__DEFAULT').setDisplaySize(64,32).setTint(0x72816c).refreshBody();
    this.gate.setVisible(false);walls.add(this.gate);
    this.gateArt=this.add.graphics().setDepth(2);
    this.gateArt.fillStyle(0x4e483a).fillRect(764,112,8,48).fillRect(828,112,8,48).fillRect(768,118,64,6).fillRect(768,150,64,6);
    this.gateArt.fillStyle(0xb7aa7b).fillRect(765,112,2,46).fillRect(768,118,64,2);
    for(let x=776;x<828;x+=12){this.gateArt.fillStyle(0x647b58).fillRect(x,123,4,27);this.gateArt.fillStyle(0x9ba778).fillRect(x,123,1,22);}
    const arriving=new URLSearchParams(window.location.search).get('arrival')==='gatehouse';
    this.player = new Player(this, arriving?656:800, arriving?1104:944, this.avatar);
    if(process.env.NODE_ENV==='development'){
      const review=new URLSearchParams(window.location.search).get('sceneReview');
      const points:Record<string,[number,number]>={stone:[816,784],bridge:[272,592],burrow:[1296,592],sanctuary:[816,208]};
      if(review&&points[review])this.player.sprite.body!.reset(...points[review]);
    }
    this.physics.add.collider(this.player.sprite, walls);
    this.cameras.main.setBounds(0, 0, 1600, 1200).startFollow(this.player.sprite, true, 0.12, 0.12);
    frameWorld(this);
    this.input.keyboard!.addCapture(Phaser.Input.Keyboard.KeyCodes.J);
    this.input.keyboard!.on('keydown-J', this.openJournal, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-J', this.openJournal, this);
    });
    this.prompt = this.add.text(0, 0, '', { fontFamily: 'Arial', fontSize: '12px', color: '#f3e3c2', backgroundColor: '#142b27', padding: { x: 10, y: 7 } }).setOrigin(0.5).setDepth(80);
    this.feedback=this.add.text(400,74,'',{fontFamily:'Georgia',fontSize:'14px',color:'#e5dab3',backgroundColor:'#283e34',padding:{x:12,y:6}}).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);
    for(const [i,x] of [688,816,944].entries()){
      const pad=this.add.rectangle(x,720,32,32,0x657668,0).setStrokeStyle(1,0x67796a).setDepth(-3);this.echoTiles.push(pad);
      this.add.image(x,720,`interior-stone-${['seed','bloom','sprout'][i]}`).setDisplaySize(32,32).setDepth(2);
      this.add.text(x,749,['SEED','BLOOM','SPROUT'][i],{fontSize:'8px',color:'#d4cba5'}).setOrigin(0.5).setDepth(2);
    }
    const signPositions = [[272,560],[1296,560],[816,880]];
    ['BRIDGE', 'BURROW', 'TRAIL'].forEach((name, i) => {
      const [x, y] = signPositions[i];
      this.add.image(x,y,'interior-way-sign').setDisplaySize(32,32).setDepth(2);obstacle(x,y,32,32);
      const label = this.add.text(x, y - 29, '', { fontFamily: 'Georgia', fontSize: '10px', color: '#eddfb8',backgroundColor:'#31483c',padding:{x:4,y:3} }).setOrigin(0.5).setDepth(3);
      this.labels.push(label);
      this.sites.push({ x, y: y + 30, label: `CHANGE ${name} WORD`, action: () => {
        if (this.solved) { this.say('The restored sign holds steady. The sanctuary is north of the central stone.'); return; }
        this.words[i] = WORDS[(WORDS.indexOf(this.words[i]) + 1) % WORDS.length];
        this.refreshSigns(); this.save();
      } });
    });
    [[208,304],[1360,304],[1104,944]].forEach(([x, y], i) => {
      this.add.image(x,y,'interior-lectern').setDisplaySize(32,32).setDepth(2);obstacle(x,y,32,32);
      this.sites.push({ x, y: y + 28, label: 'READ FIELD NOTE', action: () => { this.found.add(i); this.save(); this.say(CLUES[i] + '\n\nCopied into your field notes. Press J to reread them anywhere.'); } });
    });
    g.fillStyle(0x455f52).fillRect(768,608,64,32);g.fillStyle(0xb5bd9b).fillRect(768,608,64,3);
    this.add.image(768,576,'interior-tablet').setDisplaySize(32,32).setOrigin(0).setDepth(2);
    this.add.image(800,576,'interior-lectern').setDisplaySize(32,32).setOrigin(0).setDepth(2);
    obstacle(800,608,64,64);
    this.sites.push({ x: 800, y: 664, label: 'TEST THE THREE SIGNS', action: () => this.testSigns() });
    this.sites.push({x:656,y:1104,label:'RETURN THROUGH THE GATEHOUSE',action:()=>{this.save();this.player.stopMovement();this.locked=true;openDoorAnimation(this,656,1056,()=>enterGatehouse(this,'wordwood'),'wayfarer');}});
    this.events.on(Phaser.Scenes.Events.RESUME,()=>{this.locked=false;this.cameras.main.fadeIn(180);});
    this.sites.push({x:624,y:784,label:'READ THE GARDENER’S VERSE',action:()=>this.say('First a SEED sleeps below.\nThen a SPROUT greets the sun.\nAt last the BLOOM opens.\n\nWhen the signs agree, walk this story across the three stones. A wrong step begins the verse again; nothing else is lost.')});
    this.sites.push({ x: 800, y: 80, label: 'RECOVER THE LIVING FRAGMENT', action: () => {
      if (!this.echoOpen || this.completed) return;
      this.completed = true;markChapterComplete(2);this.save();
      this.say('The fragment warms in your hands. Somewhere in Inkwell, a missing word returns to a page.\n\nWordwood is restored. You can keep exploring or return through the gatehouse.');
    } });
    this.refreshSigns(); if (this.echoOpen) this.openRoute();
    if(this.found.size===0&&!this.solved&&!(process.env.NODE_ENV==='development'&&new URLSearchParams(window.location.search).has('sceneReview')))
      this.say('THE PATHS THAT FORGOT\n\nRestore the bridge, burrow and winding trail by changing their describing words. Find the survey notes, then test your answers at the central stone.\n\nThe old gardener left one last puzzle for the sanctuary. J keeps your notes close. Your progress stays saved when you return to Inkwell.');
  }

  private tree(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x0c2926, 0.6); g.fillEllipse(x + 14, y + 35, 90, 34);
    g.fillStyle(0x76533b); g.fillRect(x - 9, y, 18, 35);
    g.fillStyle(0xa28355).fillRect(x - 8, y + 3, 4, 29);
    leafCluster(g, x, y - 20, 43, 0x183d32, 0x386747);
    leafCluster(g, x - 14, y - 34, 28, 0x315d40, 0x62824f);
    leafCluster(g, x + 20, y - 25, 24, 0x284f38, 0x4b7548);
  }
  private openJournal() {
    if (this.panel) return;
    this.say('FIELD NOTES\n\n' + (this.found.size ? [...this.found].sort().map((i) => CLUES[i]).join('\n\n') : 'No notes yet. Look for pale survey papers beside the paths.')+'\n\nSanctuary verse: seed → sprout → bloom.');
  }
  private refreshSigns() {
    this.labels.forEach((label, i) => label.setText(this.words[i].toUpperCase()));
    const g=this.landmarkChanges;g.clear();
    if(this.words[0]==='sturdy')for(const x of [248,318])for(const y of [402,442,482,520]){
      g.fillStyle(0x384334).fillRect(x,y,9,12);g.fillStyle(0xd1b980).fillRect(x,y,9,3);g.fillStyle(0x8a754d).fillRect(x+1,y+3,3,8);
    }
    if(this.words[1]==='hollow'){g.fillStyle(0x101f1c).fillEllipse(1223,457,34,48);g.fillStyle(0x91a96e).fillRect(1216,451,3,3).fillRect(1230,451,3,3);}
    if(this.words[2]==='winding')for(const [x,y] of [[672,828],[704,804],[736,844],[768,804]]){g.fillStyle(0xd8c993).fillRect(x,y,8,8);g.fillStyle(0x768a58).fillRect(x+3,y+8,2,6);}
  }
  private save() {
    if(process.env.NODE_ENV==='development'&&new URLSearchParams(window.location.search).has('sceneReview'))return;
    const progress = getStoryProgress();
    saveStoryProgress({ chapterCheckpoints: { ...progress.chapterCheckpoints, 2: JSON.stringify({ words: this.words, found: [...this.found], solved: this.solved,echoOpen:this.echoOpen,echoStep:this.echoStep }) } });
  }
  private testSigns() {
    if (this.solved) { this.say(this.echoOpen?'The sanctuary is open. Follow the northern path.':'The signs agree. Now walk the gardener’s verse across the stones: seed, sprout, bloom.'); return; }
    if (this.found.size < 3) { this.say(`You have found ${this.found.size} of 3 field notes. Explore the northwest, northeast, and southeast paths before asking the forest to trust your answer.`); return; }
    const error = checkWordwood(this.words);
    if (error) { this.say(error + '\n\nNothing is lost. Revisit a sign with E and consult your field notes with J.'); return; }
    this.solved = true; this.save();
    this.say('STURDY bears weight. HOLLOW leaves space inside. WINDING bends along its route.\n\nThe three stones south of here wake up. Read the gardener’s verse and walk its stages in order to open the sanctuary.');
  }
  private openRoute() {
    this.gate.body!.enable = false; this.gate.setVisible(false);
    this.gateArt.setVisible(false);
    this.route.fillStyle(0xc0a679); this.route.fillRect(768,96,64,480);
    this.cameras.main.flash(250, 160, 200, 170);
  }
  private say(text: string) {
    this.panel?.destroy(); this.player.stopMovement(); this.prompt.setVisible(false);
    const bg = this.add.rectangle(400, 402, 710, 312, 0x122a25, 0.98).setStrokeStyle(2, 0x8d9974);
    const copy = this.add.text(65, 265, text, { fontFamily: 'Georgia', fontSize: '17px', color: '#eee1be', wordWrap: { width: 666 }, lineSpacing: 5 });
    const hint = this.add.text(735, 535, 'E · CLOSE', { fontSize: '12px', color: '#a7c2a4' }).setOrigin(1,0);
    this.panel = this.add.container(0, 0, [bg, copy, hint]).setScrollFactor(0).setDepth(100);
    this.nextInput = this.time.now + 220;
  }
  update(_time: number, delta: number) {
    if(this.locked)return;
    if (this.panel) {
      if (this.time.now > this.nextInput && this.player.isInteractJustDown()) { this.panel.destroy(); this.panel = null; }
      return;
    }
    this.player.update(delta);
    this.labels.forEach(label=>label.setVisible(Phaser.Math.Distance.Between(this.player.x,this.player.y,label.x,label.y+29)<160));
    const stone=[688,816,944].findIndex(x=>Phaser.Math.Distance.Between(this.player.x,this.player.y,x,720)<9);
    if(stone!==this.lastStone){
      this.lastStone=stone;
      if(stone>=0&&this.solved&&!this.echoOpen){
        this.echoStep=advanceEcho(this.echoStep,stone);
        this.echoTiles.forEach(tile=>tile.setStrokeStyle(1,0x67796a));
        this.echoTiles[stone].setStrokeStyle(2,0xdce1a7);
        this.feedback.setText(this.echoStep===3?'The sanctuary opens. Follow the northern path.':this.echoStep?`${this.echoStep} / 3 — the verse continues.`:'The verse restarts. Seed, sprout, bloom.').setVisible(true);
        this.time.delayedCall(3200,()=>this.feedback.setVisible(false));
        if(this.echoStep===3){this.echoOpen=true;this.openRoute();}
        this.save();
      }
    }
    const nearest = this.sites.filter((site) => Phaser.Math.Distance.Between(this.player.x, this.player.y, site.x, site.y) < 62)
      .sort((a, b) => Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y) - Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y))[0];
    this.prompt.setVisible(!!nearest);
    if (nearest) {
      if(nearest.label==='RETURN THROUGH THE GATEHOUSE'){
        this.prompt.setVisible(false);
        if(Math.abs(this.player.x-nearest.x)<24&&this.player.wantsDoor('up'))nearest.action();
        return;
      }
      this.prompt.setText('[ E ] ' + nearest.label).setPosition(this.player.x, this.player.y - 50);
      if (this.player.isInteractJustDown()) nearest.action();
    }
  }
}
