import type { CFIView } from "./view";
import type { PlacementProvider, Size } from "./placement";
import type { CFISelectionUtils } from "../select/selector";


export interface CFIAnnotation<C> {
    id          : string;
    startAddr   : CFISelectionUtils.FullAddress
    endAddr     : CFISelectionUtils.FullAddress
    content     : C;
}

export interface AnnotationRendered {
    element: HTMLElement;
    size: Size;
}

export type AnnotationRenderer<C> = (content: C) => AnnotationRendered | null;


interface Options {
    classNames: string[];
    idPrefix: string;
}

const DEFAULT_OPTIONS: Options = {
    classNames: ['__annotation__'],
    idPrefix: '__annotation__'
}

interface AnnotationEntry<C> {
    id: string;
    annotation: CFIAnnotation<C>;
    element: HTMLElement;
}



export class CFIAnnotationManager<C> {
    protected _annotations: AnnotationEntry<C>[] = [];
    protected _options: Options;
    constructor(
        protected _view: CFIView, 
        protected _placement: PlacementProvider,
        protected _renderer: AnnotationRenderer<C>,
        _options: Partial<Options> = {}
    ) {
        this._options = {
            ...DEFAULT_OPTIONS,
            ..._options,
        }
    }
    // TODO: crowding resolution, overlap detection

    protected _createElement(annotation: CFIAnnotation<C>) {
        const target = this._view.boundingRectForRange(annotation.startAddr, annotation.endAddr);
        if (!target) {
            return null;
        }
        const rendered = this._renderer(annotation.content);
        if (!rendered) {
            return null;
        }
        const {element, size} = rendered;
        const position = this._placement.place({target, subject: size});
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = `${String(position.x)}px`;
        container.style.top = `${String(position.y)}px`;
        container.style.width = `${String(size.width)}px`;
        container.style.height = `${String(size.height)}px`;
        container.classList.add(...this._options.classNames);
        container.id = `${this._options.idPrefix}${annotation.id}`;
        container.appendChild(element);
        return container;
    }

    protected _findAnnotationElementById(id: string) {
        return this._view.document.getElementById(`${this._options.idPrefix}${id}`);
    }

    get annotations() {
        return this._annotations.map(a => a.annotation);
    }

    addAnnotation(annotation: CFIAnnotation<C>) {
        this.removeAnnotation(annotation.id);
        const element = this._createElement(annotation);
        if (element) {
            this._annotations.push({id: annotation.id, annotation, element});
            this._view.document.body.appendChild(element);
            return true;
        }
        return false;
    }

    removeAnnotation(id: string) {
        let element = this._annotations.find(a => a.id === id)?.element ?? null;
        if (element) {
            element.remove();
        } else {
            element = this._findAnnotationElementById(id);
            if (element) {
                element.remove();
            }
        }
        this._annotations = this._annotations.filter(a => a.id !== id);
    }

    getAnnotation(id: string) {
        return this._annotations.find(a => a.id === id)?.annotation;
    }

    updateAnnotation(annotation: CFIAnnotation<C>) {
        const entry = this._annotations.find(a => a.id === annotation.id);
        if (entry) {
            entry.annotation = annotation;
            const element = this._createElement(annotation);
            if (element) {
                entry.element.replaceWith(element);
                entry.element = element;
            }
        } else {
            this.addAnnotation(annotation);
        }
    }

    reflow() {
        for (const annotation of this._annotations) {
            const element = this._createElement(annotation.annotation);
            if (element) {
                annotation.element.replaceWith(element);
                annotation.element = element;
            }
        }
    }

    removeAll() {
        for (const annotation of this._annotations) {
            annotation.element.remove();
        }
        this._annotations = [];
    }
}

