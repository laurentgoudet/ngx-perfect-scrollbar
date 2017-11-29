import { OnInit, OnDestroy, DoCheck, EventEmitter, ElementRef, ChangeDetectorRef } from '@angular/core';
import { PerfectScrollbarDirective } from './perfect-scrollbar.directive';
import { PerfectScrollbarConfigInterface } from './perfect-scrollbar.interfaces';
export declare class PerfectScrollbarComponent implements OnInit, OnDestroy, DoCheck {
    private cdRef;
    private elementRef;
    states: any;
    notify: boolean;
    userInteraction: boolean;
    allowPropagation: boolean;
    private cancelEvent;
    private timeoutState;
    private timeoutScroll;
    private usePropagationX;
    private usePropagationY;
    private statesSub;
    private statesUpdate;
    private activeSub;
    private activeUpdate;
    disabled: boolean;
    usePSClass: boolean;
    autoPropagation: boolean;
    scrollIndicators: boolean;
    config: PerfectScrollbarConfigInterface;
    directiveRef: PerfectScrollbarDirective;
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
    onGeneratedEvent(event: any): void;
    constructor(cdRef: ChangeDetectorRef, elementRef: ElementRef);
    ngOnInit(): void;
    ngOnDestroy(): void;
    ngDoCheck(): void;
    getConfig(): PerfectScrollbarConfigInterface;
    onTouchEnd(event?: Event): void;
    onTouchMove(event?: Event): void;
    onTouchStart(event?: Event): void;
    onWheelEvent(event?: Event): void;
    onScrollEvent(event: Event, state: string): void;
}