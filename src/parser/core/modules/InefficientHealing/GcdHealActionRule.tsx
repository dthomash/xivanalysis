import {ActionLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import React from 'react'
import {HealActionEvaluator, HealActionSuggestion, HealActionSnapshot} from './InefficientHealing'

export class GcdHealActionEvaluator implements HealActionEvaluator {

	constructor(private ogcdHealActions: Action[]) {}

	evaluate(healActionSnapshot: HealActionSnapshot): HealActionSuggestion | undefined {
		if (this.ogcdHealActions.some(action => healActionSnapshot.availableHealActions.includes(action.id))) {
			const availableOgcds = this.ogcdHealActions.filter(action => healActionSnapshot.availableHealActions.includes(action.id))
			return {
				healAction: healActionSnapshot?.action?.id,
				timestamp: healActionSnapshot.timestamp,
				issue: 'Inefficient GCD Heal',
				suggestion: <>The following oGCD options were available and should've been used instead: {availableOgcds.map(availableOgcd => <ActionLink key={availableOgcd.id} {...availableOgcd}></ActionLink>)}</>,
			}
		}

		return undefined
	}
}
