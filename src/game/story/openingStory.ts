export const RESCUE_POSITIONS:Record<string,{x:number;y:number}>={
  Mira:{x:2672,y:272}, 'Sir Serif':{x:2704,y:272},
  Bramble:{x:2672,y:304}, Pip:{x:2704,y:304}, Luma:{x:2640,y:272},
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
    'Sir Serif: Blotlings. That violet stuff is corrupted ink, but I’ve never seen an outbreak like this. I can keep the road clear. I can’t tell you what caused it.',
    'You describe the masked stranger and the ink spilling behind them.',
    'Sir Serif: The stranger went toward Wordwood. If the creatures followed them, Bellum needs to hear about it. I won’t pretend I know why.',
    'Sir Serif: Go through the gatehouse into Inkwell. Find Scholar Bellum in the Archive—the large stone hall on the east side. Tell him what you saw.',
    'Mira: We’ll take Luma home. You’ve done enough worrying for all of us today.',
  ],
  scholar: [
    'Serif sent you? Bellum. Ink scholar. The chair is under the books—no, the other books. Are you hurt?',
    'You describe the bell, the masked stranger, and the purple creatures on the road.',
    'Violet? Not blue with a reddish edge? Sorry. It sounds fussy. With ink, the fussy bits are often the important bits.',
    'I rang the bell. I saw someone masked leaving the Archive, then ink moving where ink had no business moving. I rather dropped my notebook.',
    'Serif calls them Blotlings. What makes the ink behave like that? I don’t know. I’ve underlined “don’t know.” Twice. It’s important not to mistake a theory for an answer.',
    'Wait—you repaired the road seals by choosing the right words? Oh! That is interesting. Frightening circumstances. Excellent observation.',
    'Wordwood has much older inscriptions. If the violet ink reached them, comparing their condition with the road seals might give us something to work with.',
    'Restore the woodland signs, then look beyond the sanctuary gate. The caretakers kept a Wordwood Tablet in their old repository. Its original lettering could give us something to compare with the damaged seals.',
    'The eastern exit in the northern Wayfarer Gatehouse leads to Wordwood. Bring the Tablet back if it’s safe to retrieve. And note what you actually see. Even observations that spoil my theory.',
    'And don’t chase that stranger alone. I want you back, not just your notes. There. A sensible instruction. I should write it down for myself.',
  ],
} as const;

export const RESCUED_CHATTER: Record<string, readonly string[]> = {
  Mira: ['Luma is safe. That is the important thing. Thank you for coming when she asked.'],
  Pip: ['I’m keeping the branch. We went through something together.'],
  'Sir Serif': ['Find Scholar Bellum in the Archive, on the east side of Inkwell. Tell him about the masked stranger and the corrupted ink.'],
  Bramble: ['The ink got into the roots. Even the orchard went quiet. I’ll come back when it’s safe and see what can be saved.'],
};
