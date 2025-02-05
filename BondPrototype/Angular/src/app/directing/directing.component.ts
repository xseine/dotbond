import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {IComponentHeaderText} from '../app.component';
import {QueryService} from '../api/actions/query.service';
import {
    combineLatest,
    distinctUntilKeyChanged,
    firstValueFrom,
    map,
    mergeWith,
    Observable,
    of,
    scan,
    share,
    shareReplay,
    startWith,
    Subject,
    switchMap, switchScan,
    tap
} from 'rxjs';
// @ts-ignore
import emptyBoxSource from '/src/assets/icons/empty-box.svg';
import {Picker} from "@spectrum-web-components/bundle";

@Component({
    selector: 'directing',
    template: `

        <div class="spectrum-Form-item" style="margin-top: 1em">
            <sp-field-label for="picker-m" size="m">Add an actor:</sp-field-label>
            <sp-picker id="picker-m" size="m" label="Actor name" #picker (change)="actorPick.next(+picker.value)">
                <sp-menu-item *ngFor="let actor of unselectedActors$ | async" value="{{actor.id}}">{{actor.name}}</sp-menu-item>
            </sp-picker>
        </div>

        <div class="spectrum-grid">
            <table class="actors spectrum-Table spectrum-Table--sizeM spectrum-Table--spacious spectrum-Table--quiet"
                   *ngIf="(selectedActors$ | async)?.length">
                <thead class="spectrum-Table-head">
                <tr>
                    <th class="spectrum-Table-headCell"></th>
                    <th class="spectrum-Table-headCell"></th>
                    <th class="spectrum-Table-headCell">Average movie rating</th>
                    <th class="spectrum-Table-headCell">Number of movies</th>
                    <th class="spectrum-Table-headCell">Colleagues</th>
                    <th></th>
                </tr>
                </thead>
                <tbody class="spectrum-Table-body" [transition-group]="'flip-list'">
                <tr class="spectrum-Table-row" *ngFor="let actor of selectedActors$ | async"
                    (mouseenter)="addHoverOnColleagues(actor.id, getIds(actor.colleagues))"
                    (mouseleave)="removeHoverFromColleagues()"
                    [ngClass]="{'hover': hoveredColleagues.includes(actor.id)}"
                    transition-group-item
                >
                    <td class="spectrum-Table-cell"><img [src]="actor.picture | safeUrl" alt="Actor's photo"/></td>
                    <td class="spectrum-Table-cell"><h2 class="spectrum-Heading spectrum-Heading--sizeS">{{actor.name}}</h2></td>
                    <td class="spectrum-Table-cell">{{Math.round(actor.average * 10) / 10}} / 10</td>
                    <td class="spectrum-Table-cell">{{actor.numberOfMovies}}</td>
                    <td class="spectrum-Table-cell">{{getNames(actor.colleagues).join(',\\n')}}</td>
                    <td class="remove spectrum-Table-cell" (click)="actorRemoval.next(actor.id)">
                        <sp-icon-close></sp-icon-close>
                    </td>
                </tr>
                </tbody>
            </table>

            <empty-illustration heading="Table is empty" description="Select actors to view their stats"
                                *ngIf="!(selectedActors$ | async)?.length"></empty-illustration>
        </div>
    `,
    styleUrls: ['./directing.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DirectingComponent implements OnInit, OnDestroy, IComponentHeaderText {
    readonly headerText = 'Direct your own';

    unselectedActors$: Observable<{ name: string, id: number }[]>;
    selectedActors$: Observable<ProfileAndStatsType[]>;
    actorPick = new Subject<number>();
    actorRemoval = new Subject<number>();
    Math = Math;

    joinColleagues = new Subject<{ actorId: number, colleagues: number[] }>();

    @ViewChild('picker') picker: ElementRef<Picker>;

    constructor(private _api: QueryService, private _cd: ChangeDetectorRef) {
    }

    async ngOnInit() {

        let actors = await firstValueFrom(this._api.GetListOfActorNames());
        let selectedIds$ = this.actorPick.pipe(
            scan((acc, curr) => [...acc, curr], [] as number[]),
            switchMap(pickAcc => this.actorRemoval.pipe(
                scan((acc, curr) => {
                    acc.splice(acc.indexOf(curr), 1);
                    return acc;
                }, pickAcc),
                startWith(pickAcc)
            )),
            share()
        );
        

        this.unselectedActors$ = selectedIds$.pipe(map(ids => actors.filter(e => !ids.includes(e.id))), startWith(actors));
        this.selectedActors$ = selectedIds$.pipe(
            switchScan((acc, curr) => {
                acc = acc.filter(e => curr.includes(e.id));

                if (curr.length == acc.length) return of(acc);

                let newIds = curr.filter(id => !acc.map(e => e.id).includes(id));
                return combineLatest(...newIds.map(newId => this._api.GetShortProfileAndWorkStats(newId))).pipe(map(data => acc.concat(data)));
            }, [] as ProfileAndStatsType[]),
            switchMap(profilesAndStats => {
                let order = profilesAndStats;
                return this.joinColleagues.pipe(distinctUntilKeyChanged('actorId'), map(({actorId, colleagues}) => {
                    let nonColleaguesBefore = order.slice(0, order.findIndex(e => e.id === actorId)).filter(e => !colleagues.includes(e.id));
                    let nonColleaguesAfter = order.slice(order.findIndex(e => e.id === actorId) + 1).filter(e => !colleagues.includes(e.id));

                    order = [...nonColleaguesBefore, ...order.filter(e => e.id === actorId || colleagues.includes(e.id)), ...nonColleaguesAfter];

                    return [...order];
                }), startWith(profilesAndStats));
            }),
            shareReplay(1)
        );
        
        this._cd.detectChanges();
    }
    
    ngOnDestroy() {
        this.actorPick.unsubscribe();
    }

    /*========================== Event Listeners ==========================*/

    hoveredColleagues: number[] = [];

    addHoverOnColleagues(actorId: number, colleaguesIds: number[]): void {
        this.hoveredColleagues = colleaguesIds;
        this.joinColleagues.next({actorId, colleagues: colleaguesIds});
    }

    removeHoverFromColleagues(): void {
        this.hoveredColleagues = [];
    }

    /*========================== Public API ==========================*/

    public getNames(data: { name: string, id: number }[]): string[] {
        return data.map(e => e.name);
    }

    public getIds(data: { name: string, id: number }[]): number[] {
        return data.map(e => e.id);
    }

}

type ProfileAndStatsType = ReturnType<QueryService['GetShortProfileAndWorkStats']> extends Observable<infer ProfileAndStatsType> ? Omit<ProfileAndStatsType, '[Symbol.iterator]'> : never;
