import {describe,it,expect} from 'vitest';
import {canEnterInnRoom,innPlan,innRoutine,INN_PEOPLE} from '../src/game/story/inn';
import {TOWN} from '../src/game/story/townPlan';

describe('Lantern Inn',()=>{
  it('keeps the furnished upstairs landing routes clear',()=>{
    const props=innPlan(2).props;
    expect(props.some(p=>p.asset==='desk')).toBe(true);
    expect(props.some(p=>p.asset==='washstand')).toBe(true);
    expect(props.some(p=>p.row===1||p.col===5||p.col===8)).toBe(false);
    expect(new Set(props.map(p=>`${p.col},${p.row}`)).size).toBe(props.length);
  });
  it('gives all guests distinct layouts and unobstructed activity paths',()=>{
    const layouts=[];
    for(const floor of [1,2] as const)for(const room of [1,2,3]){
      const plan=innPlan(floor,room),stops=innRoutine(floor,room);
      layouts.push(JSON.stringify(plan));
      expect(new Set(plan.props.map(p=>`${p.col},${p.row}`)).size).toBe(plan.props.length);
      for(const stop of stops)expect(plan.props.some(p=>p.col===stop.col&&p.row===stop.row&&p.asset!=='chair')).toBe(false);
      expect(Math.abs(stops[0].col-stops[1].col)).toBe(floor===1&&room===2?0:1);
      expect(stops[0].row).toBe(stops[1].row);
      if(!(floor===1&&(room===2||room===3)))for(const stop of stops){
        expect(plan.props.some(p=>Math.abs(p.col-stop.col)+Math.abs(p.row-stop.row)===1)).toBe(true);
      }
    }
    expect(new Set(layouts).size).toBe(6);
  });
  it('has a concierge and one distinct speaker in each room',()=>{
    expect(INN_PEOPLE.filter(p=>p.room===0)).toHaveLength(1);
    expect(INN_PEOPLE.filter(p=>p.room>0).map(p=>p.room)).toEqual([101,102,103,201,202,203]);
    expect(new Set(INN_PEOPLE.map(p=>p.name)).size).toBe(7);
  });
  it('replaces the village home with a southern inn',()=>{
    expect(TOWN.buildings.some(b=>b.id==='home')).toBe(false);
    const inn=TOWN.buildings.find(b=>b.id==='inn')!;
    expect(inn.y).toBeGreaterThan(Math.max(...TOWN.buildings.filter(b=>b.id!=='inn').map(b=>b.y)));
  });
  it('requires a booking only for the middle room upstairs',()=>{
    for(const floor of [1,2])for(const room of [1,2,3]){
      expect(canEnterInnRoom(floor,room,false)).toBe(!(floor===2&&room===2));
      expect(canEnterInnRoom(floor,room,true)).toBe(true);
    }
    expect(canEnterInnRoom(3,2,true)).toBe(false);
  });
  it('furnishes all six rooms with beds and keeps their exits clear',()=>{
    for(const floor of [1,2] as const)for(const room of [1,2,3]){
      const plan=innPlan(floor,room);
      expect(plan.props.some(p=>p.asset==='bed-head')).toBe(true);
      expect(plan.props.some(p=>p.col===5&&p.row>=6)).toBe(false);
    }
  });
});
