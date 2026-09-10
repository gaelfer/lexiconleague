export const CHAPTER_ONE_STORY = {
  title: 'The Road to Inkwell',
  opening: [
    'Mira: Inkwell’s bells. We are almost home—wait. Something is on the bridge.\nPip: Please let it be a very large biscuit.',
    'Serif: Keep the travellers behind me!\nPip: The one with the silver sleeve is running!\nMira: Clear the crossing. We need to reach the village gatehouse.',
  ],
  evidence: [
    'A torn page is caught between the stones. Silver dust clings to one edge.\nPip: Is it a clue? I have always wanted to find a clue.',
    'Mira: That is Inkwell’s Archive seal. Something has happened beyond the walls. Restore the three road seals so we can get home.\nPip: I will carry the clue. Very responsibly. Mostly.',
  ],
} as const;

export const ROAD_CHATTER:Record<string,readonly string[]>={
  Mira:['The village is beyond the eastern gatehouse. Those bells are usually for market day. This is not market day.', 'The survey camp has spare maps. None of them mention the road forgetting its own name.'],
  Pip:['I packed biscuits for the journey. Then the journey got longer.', 'If anyone asks, the crumbs are a trail marker. Very important navigation work.'],
  'Sir Serif':['I will hold the crossing while you restore the seals. That is the plan.', 'If I shout “tactical retreat,” please bring the travellers. And Pip. Especially Pip.'],
  Bramble:['There is an old orchard off the southern path. The trees outlasted the farm.', 'Once the road is safe, I will come back for cuttings. A village should always have something growing.'],
};
