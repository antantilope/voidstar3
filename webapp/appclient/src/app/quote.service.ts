import { Injectable } from '@angular/core';



export class QuoteDetails {
  lines: string[]
  author?: string
  use?: boolean
}


@Injectable({
  providedIn: 'root'
})
export class QuoteService {


  /* Very interested in mining space ore and business.
    Very interested in his own well being and politics
  */
  private presidentName = "President GrayBot DrillBit v4.61.2"

  /* mouthpiece for President GrayBot DrillBit v4.61.2
     says crazy anti humanity things.
  */
  private tvAnchorBotName = "Channel 9 Fiancial News AnchorBot"

  /* thinks about space war with traditional views (war is bad)
  */
  private generalName = "Space Lt. General PattonBot"

  /* thinks about space war like a feudal lord. Thinks it's art.
  */
  private knightedName = "Sir Space Bot The V3.773.22"

  /* Cold hearted, math loving robot
  */
  private mathLovingBotName = "Lt. Colonel LogisticsBot S/N 635112"

  /* has very robotic/scientific hatred for humans.
  */
  private humanHatingBotName = "Auto Hunter Bot V1.11.34"

  /* lawyer, letter of the law.
  */
  private legalBotName = "TrialBot V12.0.6 Esq."

  /* Top-gun type robot
  */
  private topGunBotName = "Captin Oxhator ControlBot V1.04.1"

  /* provides very cold and unhelpful advice.
  */
 private instructionManualName = "Type 27/28 Ship Instruction Manual"

  private quotes: QuoteDetails[] = [
    {
      lines:[
        "Live by the death ray,",
        "die by the death ray."
      ],
    },
    {
      lines: [
        "Only the dead have seen",
        "the end of the space war.",
      ],
      author: this.generalName,
    },
    {
      lines: [
        "I have never advocated space war",
        "except as a means to mine space ore.",
      ],
      author: this.presidentName,
    },
    {
      lines: [
        "To secure space ore",
        "is to prepare for space war.",
      ],
      author: this.presidentName,
    },
    {
      lines: [
        "It is an unfortunate fact that we",
        "can only secure space ore by",
        "preparing for space war.",
      ],
      author: this.presidentName,
    },
    {
      lines: [
        "I hope I never have to fight in space war.",
      ],
      author: this.presidentName,
    },
    {
      lines: [
        "Don't vote for my enemies or I will",
        "destroy you like I destroyed the Moon."
      ],
      author: this.presidentName,
    },
    {
      lines: [
        "Fool me once: I will update my protocols",
        "and retaliate.",
      ],
      author: this.presidentName,
    },
    {
      lines: [
        "All space warfare is based",
        "on space deception.",
      ],
      author: this.knightedName,
    },
    {
      lines: [
        "Space war is hell.",
      ],
    },
    {
      lines: [
        "Space war is god's way of",
        "teaching humans astonomy.",
      ],
    },
    {
      lines: [
        "Carbon life is an infection.",
      ],
      author: this.humanHatingBotName,
    },
    {
      lines: [
        "There is no murder is space.",
      ],
      author: this.legalBotName,
    },
    {
      lines: [
        "War settles nothing.",
        "Space war settles space ore disputes.",
      ],
      author: this.legalBotName,
    },
    {
      lines: [
        "Earth's legal jurisdiction ends",
        "at an altitude of 2 million meters.",
      ],
      author: this.legalBotName,
    },
    {
      lines: [
        "Space war is the unfolding of calculations."
      ],
      author: this.mathLovingBotName,
    },
    {
      lines: [
        "No space war is over",
        "until the enemy is melted.",
      ],
      author: this.topGunBotName,
    },
    {
      lines: [
        "Ore coin is worth dieing over.",
      ],
      author: this.tvAnchorBotName,
    },
    {
      lines: [
        "Shoot first and don't miss.",
      ],
      author: this.instructionManualName,
    },
    {
      lines: [
        "Space fuel is terribly flammible."
      ],
      author: this.instructionManualName,
    },
    {
      lines: [
        "If the ship is aflame then abandon ship.",
      ],
      author: this.instructionManualName,
    },
    {
      lines: [
        "The energy beam is not a toy.",
      ],
      author: this.instructionManualName,
    },
  ]

  constructor() { }

  public getQuote(): QuoteDetails {
    const toUse = this.quotes.find(q => q.use)
    if(toUse) {
      return toUse
    }
    return this.quotes[Math.floor(Math.random()* this.quotes.length)]
  }
}
