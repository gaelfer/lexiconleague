export const RESCUE_POSITIONS:Record<string,{x:number;y:number}>={
  Mira:{x:2672,y:272}, 'Sir Serif':{x:2736,y:272},
  Bramble:{x:2672,y:336}, Pip:{x:2736,y:336}, Luma:{x:2640,y:272},
};

export const OPENING_STORY = {
  luma: [
    'That masked person! They came from town. When they ran past, those purple things climbed out of the ink behind them!',
    'Mum is up the road with the others. I ran to get help, but now I can’t get back. Please—will you help her?',
    'I’m coming with you. I’ll stay right behind you, promise. Just… please help me find Mum.',
  ],
  rescue: [
    'Luma: Mum! Hi! I brought help! And I stayed behind them. Almost the whole time.',
    'Mira: Luma! Come here. Oh, you frightened me. Thank you for bringing her back safely.',
    'Mira: Oh, thank goodness. I told her to stay close. She’s very good at the “stay” part. Less good at “close.”',
    'Pip: You fought all of those? I was holding this branch. For morale.',
    'Sir Serif: You did well. I couldn’t leave these three unprotected. You gave us a way out.',
    'Sir Serif: Those creatures are Blotlings—corrupted ink. Ink gives our words their shape. When it’s corrupted, the words twist… and sometimes the ink starts moving on its own.',
    'You describe the masked stranger and the ink spilling behind them.',
    'Sir Serif: Then this wasn’t an accident. They slipped toward Wordwood before we could stop them.',
    'Sir Serif: Go through the gatehouse into Inkwell. Find Scholar Vellum in the Archive—the large stone hall on the east side. Tell him what you saw.',
    'Mira: We’ll take Luma home. You’ve done enough worrying for all of us today.',
  ],
  scholar: [
    'Serif sent you? Come in. Mind the papers. They’re arranged in a system. Unfortunately, the system is “where they fell.”',
    'You describe the bell, the masked stranger, and the purple creatures on the road.',
    'The bell was mine. Someone broke into the Archive and stole a leaf from the First Dictionary. I saw the mask—but not their face.',
    'These aren’t ordinary pages. They help keep the words around us steady. Tear one away, and names lose their meaning. That’s why the road seals stopped working.',
    'You restored them? By finding the right words? Good. That means we can still repair the damage.',
    'Wordwood has older word-stones. If the thief went that way, the stones will have felt it. Restore their inscriptions, then find the sanctuary at the end of the wood.',
    'The sanctuary should show us where the missing leaf was taken. Bring back what you learn. Don’t try to corner the stranger alone.',
    'Take the Wordwood exit in the Wayfarer Gatehouse, north of the village. You can come back whenever you need to. And eat something first. Scholarship runs terribly on an empty stomach.',
  ],
} as const;

export const RESCUED_CHATTER: Record<string, readonly string[]> = {
  Mira: ['Luma is safe. That is the important thing. Thank you for coming when she asked.'],
  Pip: ['I’m keeping the branch. We went through something together.'],
  'Sir Serif': ['Find Scholar Vellum in the Archive, on the east side of Inkwell. Tell him about the masked stranger and the corrupted ink.'],
  Bramble: ['The ink got into the roots. Even the orchard went quiet. I’ll come back when it’s safe and see what can be saved.'],
};
