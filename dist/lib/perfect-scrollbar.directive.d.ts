import { OnInit, DoCheck, OnChanges, OnDestroy, EventEmitter, NgZone, ElementRef, SimpleChanges, KeyValueDiffers } from '@angular/core';
import { Geometry, Position } from './perfect-scrollbar.interfaces';
import { PerfectScrollbarConfigInterface } from './perfect-scrollbar.interfaces';
export declare class PerfectScrollbarDirective implements OnInit, OnDestroy, DoCheck, OnChanges {
    private zone;
    elementRef: ElementRef;
    private differs;
    private defaults;
    private platformId;
    private ro;
    private instance;
    private timeout;
    private configDiff;
    disabled: boolean;
    config: PerfectScrollbarConfigInterface;
    PS_SCROLL_Y: EventEmitter<any>;
    PS_SCROLL_X: EventEmitter<any>;
    PS_SCROLL_UP: EventEmitter<any>;
    PS_SCROLL_DOWN: EventEmitter<any>;
    PS_SCROLL_LEFT: EventEmitter<any>;
    PS_SCROLL_RIGHT: EventEmitter<any>;
    PS_Y_REACH_END: EventEmitter<any>;
    PS_Y_REACH_START: EventEmitter<any>;
    PS_X_REACH_END: EventEmitter<any>;
    PS_X_REACH_START: EventEmitter<any>;
    private emit(event);
    psScrollY(event: any): void;
    psScrollX(event: any): void;
    psScrollUp(event: any): void;
    pscrollDown(event: any): void;
    psScrollLeft(event: any): void;
    psScrollRight(event: any): any;
    psReachEndY(event: any): any;
    psReachStartY(event: any): any;
    psReachEndX(event: any): any;
    psReachStartX(event: any): any;
    constructor(zone: NgZone, elementRef: ElementRef, differs: KeyValueDiffers, defaults: PerfectScrollbarConfigInterface, platformId: Object);
    ngOnInit(): void;
    ngOnDestroy(): void;
    ngDoCheck(): void;
    ngOnChanges(changes: SimpleChanges): void;
    ps(): any;
    update(): void;
    geometry(prefix?: string): Geometry;
    position(absolute?: boolean): Position;
    scrollable(direction?: string): boolean;
    scrollTo(x: number, y?: number, speed?: number): void;
    scrollToX(x: number, speed?: number): void;
    scrollToY(y: number, speed?: number): void;
    scrollToTop(offset?: number, speed?: number): void;
    scrollToLeft(offset?: number, speed?: number): void;
    scrollToRight(offset?: number, speed?: number): void;
    scrollToBottom(offset?: number, speed?: number): void;
    private animateScrolling(target, value, speed?);
}
