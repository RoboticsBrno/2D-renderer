// ==================== VISITOR INTERFACES ====================

interface CollisionVisitor {
    visitCircle(circle: CircleCollider): boolean;
    visitRectangle(rect: RectangleCollider): boolean;
    visitPolygon(polygon: PolygonCollider): boolean;
    visitLine(line: LineSegmentCollider): boolean;
    visitPoint(point: PointCollider): boolean;
    visitRegularPolygon(regularPolygon: RegularPolygonCollider): boolean;
}

interface Collidable {
    accept(visitor: CollisionVisitor): boolean;
}

// ==================== BASE COLLIDER ====================

export abstract class Collider implements Collidable {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    abstract accept(visitor: CollisionVisitor): boolean;

    abstract intersects(other: Collider): boolean;

    protected generateRegularPolygonPoints(regularPolygon: RegularPolygonCollider): { x: number; y: number }[] {
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i < regularPolygon.sides; i++) {
            const angle = (i * 2 * Math.PI / regularPolygon.sides) - Math.PI / 2;
            points.push({
                x: Math.cos(angle) * regularPolygon.radius,
                y: Math.sin(angle) * regularPolygon.radius
            });
        }
        return points;
    }

    translate(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
    }
}

class CollisionMath {
    static distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return dx * dx + dy * dy;
    }

    static pointInPolygon(x: number, y: number, points: { x: number; y: number }[]): boolean {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    static lineIntersectLine(l1: LineSegmentCollider, l2: LineSegmentCollider): boolean {
        const denominator = ((l2.y2 - l2.y) * (l1.x2 - l1.x) - (l2.x2 - l2.x) * (l1.y2 - l1.y));

        if (denominator === 0) return false; // Lines are parallel

        const ua = ((l2.x2 - l2.x) * (l1.y - l2.y) - (l2.y2 - l2.y) * (l1.x - l2.x)) / denominator;
        const ub = ((l1.x2 - l1.x) * (l1.y - l2.y) - (l1.y2 - l1.y) * (l1.x - l2.x)) / denominator;

        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }
}


// ==================== INTERSECTION VISITOR ====================

export class IntersectionVisitor implements CollisionVisitor {
    private other: Collider;

    constructor(other: Collider) {
        this.other = other;
    }

    visitCircle(circle: CircleCollider): boolean {
        if (this.other instanceof CircleCollider) {
            return this.circleCircle(circle, this.other);
        } else if (this.other instanceof RectangleCollider) {
            return this.circleRectangle(circle, this.other);
        } else if (this.other instanceof PointCollider) {
            return this.circlePoint(circle, this.other);
        } else if (this.other instanceof LineSegmentCollider) {
            return this.circleLine(circle, this.other);
        } else if (this.other instanceof PolygonCollider) {
            return this.circlePolygon(circle, this.other);
        } else if (this.other instanceof RegularPolygonCollider) {
            return this.circleRegularPolygon(circle, this.other);
        }
        return false;
    }

    visitRectangle(rect: RectangleCollider): boolean {
        if (this.other instanceof CircleCollider) {
            return this.circleRectangle(this.other, rect);
        } else if (this.other instanceof RectangleCollider) {
            return this.rectangleRectangle(rect, this.other);
        } else if (this.other instanceof PointCollider) {
            return this.rectanglePoint(rect, this.other);
        } else if (this.other instanceof LineSegmentCollider) {
            return this.rectangleLine(rect, this.other);
        } else if (this.other instanceof PolygonCollider) {
            return this.rectanglePolygon(rect, this.other);
        } else if (this.other instanceof RegularPolygonCollider) {
            return this.rectangleRegularPolygon(rect, this.other);
        }
        return false;
    }

    visitPolygon(polygon: PolygonCollider): boolean {
        if (this.other instanceof CircleCollider) {
            return this.circlePolygon(this.other, polygon);
        } else if (this.other instanceof RectangleCollider) {
            return this.rectanglePolygon(this.other, polygon);
        } else if (this.other instanceof PointCollider) {
            return this.polygonPoint(polygon, this.other);
        } else if (this.other instanceof LineSegmentCollider) {
            return this.polygonLine(polygon, this.other);
        } else if (this.other instanceof PolygonCollider) {
            return this.polygonPolygon(polygon, this.other);
        } else if (this.other instanceof RegularPolygonCollider) {
            return this.polygonRegularPolygon(polygon, this.other);
        }
        return false;
    }

    visitLine(line: LineSegmentCollider): boolean {
        if (this.other instanceof CircleCollider) {
            return this.circleLine(this.other, line);
        } else if (this.other instanceof RectangleCollider) {
            return this.rectangleLine(this.other, line);
        } else if (this.other instanceof PointCollider) {
            return this.linePoint(line, this.other);
        } else if (this.other instanceof LineSegmentCollider) {
            return this.lineLine(line, this.other);
        } else if (this.other instanceof PolygonCollider) {
            return this.polygonLine(this.other, line);
        } else if (this.other instanceof RegularPolygonCollider) {
            return this.lineRegularPolygon(line, this.other);
        }
        return false;
    }

    visitPoint(point: PointCollider): boolean {
        if (this.other instanceof CircleCollider) {
            return this.circlePoint(this.other, point);
        } else if (this.other instanceof RectangleCollider) {
            return this.rectanglePoint(this.other, point);
        } else if (this.other instanceof PointCollider) {
            return this.pointPoint(point, this.other);
        } else if (this.other instanceof LineSegmentCollider) {
            return this.linePoint(this.other, point);
        } else if (this.other instanceof PolygonCollider) {
            return this.polygonPoint(this.other, point);
        } else if (this.other instanceof RegularPolygonCollider) {
            return this.pointRegularPolygon(point, this.other);
        }
        return false;
    }

    visitRegularPolygon(regularPolygon: RegularPolygonCollider): boolean {
        // Convert regular polygon to polygon for intersection detection
        const polygonPoints = regularPolygon.generateRegularPolygonPoints();
        const polygon = new PolygonCollider(regularPolygon.x, regularPolygon.y, polygonPoints);
        const polygonVisitor = new IntersectionVisitor(this.other);
        return polygon.accept(polygonVisitor);
    }

    // ==================== INTERSECTION IMPLEMENTATIONS ====================

    private circleCircle(c1: CircleCollider, c2: CircleCollider): boolean {
        const distanceSquared = CollisionMath.distanceSquared(c1.x, c1.y, c2.x, c2.y);
        const radiusSum = c1.radius + c2.radius;
        return distanceSquared < radiusSum * radiusSum;
    }

    private circleRectangle(circle: CircleCollider, rect: RectangleCollider): boolean {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        const distanceSquared = CollisionMath.distanceSquared(circle.x, circle.y, closestX, closestY);
        return distanceSquared <= (circle.radius * circle.radius);
    }

    private circlePoint(circle: CircleCollider, point: PointCollider): boolean {
        const distanceSquared = CollisionMath.distanceSquared(circle.x, circle.y, point.x, point.y);
        return distanceSquared < (circle.radius * circle.radius);
    }

    private circleLine(circle: CircleCollider, line: LineSegmentCollider): boolean {
        const lineLength = Math.sqrt((line.x2 - line.x) ** 2 + (line.y2 - line.y) ** 2);

        if (lineLength === 0) {
            return this.circlePoint(circle, new PointCollider(line.x, line.y));
        }

        const t = Math.max(0, Math.min(1,
            ((circle.x - line.x) * (line.x2 - line.x) + (circle.y - line.y) * (line.y2 - line.y)) / (lineLength * lineLength)
        ));

        const closestX = line.x + t * (line.x2 - line.x);
        const closestY = line.y + t * (line.y2 - line.y);

        const distanceSquared = CollisionMath.distanceSquared(circle.x, circle.y, closestX, closestY);
        return distanceSquared < (circle.radius * circle.radius);
    }

    private circlePolygon(circle: CircleCollider, polygon: PolygonCollider): boolean {
        const worldPoints = polygon.getWorldPoints();

        if (CollisionMath.pointInPolygon(circle.x, circle.y, worldPoints)) {
            return true;
        }

        for (let i = 0; i < worldPoints.length; i++) {
            const j = (i + 1) % worldPoints.length;
            const line = new LineSegmentCollider(
                worldPoints[i].x, worldPoints[i].y,
                worldPoints[j].x, worldPoints[j].y
            );
            if (this.circleLine(circle, line)) {
                return true;
            }
        }

        return false;
    }

    private circleRegularPolygon(circle: CircleCollider, regularPolygon: RegularPolygonCollider): boolean {
        const polygonPoints = regularPolygon.generateRegularPolygonPoints();
        const polygon = new PolygonCollider(regularPolygon.x, regularPolygon.y, polygonPoints);
        return this.circlePolygon(circle, polygon);
    }

    private rectangleRectangle(r1: RectangleCollider, r2: RectangleCollider): boolean {
        return !(r1.x >= r2.x + r2.width ||
            r1.x + r1.width <= r2.x ||
            r1.y >= r2.y + r2.height ||
            r1.y + r1.height <= r2.y);
    }

    private rectanglePoint(rect: RectangleCollider, point: PointCollider): boolean {
        return point.x >= rect.x &&
            point.x <= rect.x + rect.width &&
            point.y >= rect.y &&
            point.y <= rect.y + rect.height;
    }

    private rectangleLine(rect: RectangleCollider, line: LineSegmentCollider): boolean {
        if (this.rectanglePoint(rect, new PointCollider(line.x, line.y)) ||
            this.rectanglePoint(rect, new PointCollider(line.x2, line.y2))) {
            return true;
        }

        const edges = [
            new LineSegmentCollider(rect.x, rect.y, rect.x + rect.width, rect.y),
            new LineSegmentCollider(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height),
            new LineSegmentCollider(rect.x + rect.width, rect.y + rect.height, rect.x, rect.y + rect.height),
            new LineSegmentCollider(rect.x, rect.y + rect.height, rect.x, rect.y)
        ];

        return edges.some(edge => this.lineLine(line, edge));
    }

    private rectanglePolygon(rect: RectangleCollider, polygon: PolygonCollider): boolean {
        const worldPoints = polygon.getWorldPoints();

        for (const point of worldPoints) {
            if (this.rectanglePoint(rect, new PointCollider(point.x, point.y))) {
                return true;
            }
        }

        const rectCorners = [
            new PointCollider(rect.x, rect.y),
            new PointCollider(rect.x + rect.width, rect.y),
            new PointCollider(rect.x + rect.width, rect.y + rect.height),
            new PointCollider(rect.x, rect.y + rect.height)
        ];

        for (const corner of rectCorners) {
            if (CollisionMath.pointInPolygon(corner.x, corner.y, worldPoints)) {
                return true;
            }
        }

        const rectEdges = [
            new LineSegmentCollider(rect.x, rect.y, rect.x + rect.width, rect.y),
            new LineSegmentCollider(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height),
            new LineSegmentCollider(rect.x + rect.width, rect.y + rect.height, rect.x, rect.y + rect.height),
            new LineSegmentCollider(rect.x, rect.y + rect.height, rect.x, rect.y)
        ];

        for (let i = 0; i < worldPoints.length; i++) {
            const j = (i + 1) % worldPoints.length;
            const polyEdge = new LineSegmentCollider(
                worldPoints[i].x, worldPoints[i].y,
                worldPoints[j].x, worldPoints[j].y
            );

            for (const rectEdge of rectEdges) {
                if (this.lineLine(rectEdge, polyEdge)) {
                    return true;
                }
            }
        }

        return false;
    }

    private rectangleRegularPolygon(rect: RectangleCollider, regularPolygon: RegularPolygonCollider): boolean {
        const polygonPoints = regularPolygon.generateRegularPolygonPoints();
        const polygon = new PolygonCollider(regularPolygon.x, regularPolygon.y, polygonPoints);
        return this.rectanglePolygon(rect, polygon);
    }

    private polygonPoint(polygon: PolygonCollider, point: PointCollider): boolean {
        const worldPoints = polygon.getWorldPoints();
        return CollisionMath.pointInPolygon(point.x, point.y, worldPoints);
    }

    private polygonLine(polygon: PolygonCollider, line: LineSegmentCollider): boolean {
        const worldPoints = polygon.getWorldPoints();

        if (this.polygonPoint(polygon, new PointCollider(line.x, line.y)) ||
            this.polygonPoint(polygon, new PointCollider(line.x2, line.y2))) {
            return true;
        }

        for (let i = 0; i < worldPoints.length; i++) {
            const j = (i + 1) % worldPoints.length;
            const edge = new LineSegmentCollider(
                worldPoints[i].x, worldPoints[i].y,
                worldPoints[j].x, worldPoints[j].y
            );
            if (this.lineLine(line, edge)) {
                return true;
            }
        }
        return false;
    }

    private polygonPolygon(p1: PolygonCollider, p2: PolygonCollider): boolean {
        const worldPoints1 = p1.getWorldPoints();
        const worldPoints2 = p2.getWorldPoints();

        for (const point of worldPoints1) {
            if (CollisionMath.pointInPolygon(point.x, point.y, worldPoints2)) {
                return true;
            }
        }

        for (const point of worldPoints2) {
            if (CollisionMath.pointInPolygon(point.x, point.y, worldPoints1)) {
                return true;
            }
        }

        for (let i = 0; i < worldPoints1.length; i++) {
            const iNext = (i + 1) % worldPoints1.length;
            const edge1 = new LineSegmentCollider(
                worldPoints1[i].x, worldPoints1[i].y,
                worldPoints1[iNext].x, worldPoints1[iNext].y
            );

            for (let j = 0; j < worldPoints2.length; j++) {
                const jNext = (j + 1) % worldPoints2.length;
                const edge2 = new LineSegmentCollider(
                    worldPoints2[j].x, worldPoints2[j].y,
                    worldPoints2[jNext].x, worldPoints2[jNext].y
                );

                if (this.lineLine(edge1, edge2)) {
                    return true;
                }
            }
        }

        return false;
    }

    private polygonRegularPolygon(polygon: PolygonCollider, regularPolygon: RegularPolygonCollider): boolean {
        const regularPolygonPoints = regularPolygon.generateRegularPolygonPoints();
        const regularAsPolygon = new PolygonCollider(regularPolygon.x, regularPolygon.y, regularPolygonPoints);
        return this.polygonPolygon(polygon, regularAsPolygon);
    }

    private linePoint(line: LineSegmentCollider, point: PointCollider): boolean {
        const crossProduct = (point.y - line.y) * (line.x2 - line.x) - (point.x - line.x) * (line.y2 - line.y);
        if (Math.abs(crossProduct) > 1e-10) return false;

        const dotProduct = (point.x - line.x) * (line.x2 - line.x) + (point.y - line.y) * (line.y2 - line.y);
        if (dotProduct < 0) return false;

        const squaredLength = (line.x2 - line.x) * (line.x2 - line.x) + (line.y2 - line.y) * (line.y2 - line.y);
        return dotProduct <= squaredLength;
    }

    private lineLine(l1: LineSegmentCollider, l2: LineSegmentCollider): boolean {
        return CollisionMath.lineIntersectLine(l1, l2);
    }

    private lineRegularPolygon(line: LineSegmentCollider, regularPolygon: RegularPolygonCollider): boolean {
        const polygonPoints = regularPolygon.generateRegularPolygonPoints();
        const polygon = new PolygonCollider(regularPolygon.x, regularPolygon.y, polygonPoints);
        return this.polygonLine(polygon, line);
    }

    private pointPoint(p1: PointCollider, p2: PointCollider): boolean {
        return p1.x === p2.x && p1.y === p2.y;
    }

    private pointRegularPolygon(point: PointCollider, regularPolygon: RegularPolygonCollider): boolean {
        const polygonPoints = regularPolygon.generateRegularPolygonPoints();
        const polygon = new PolygonCollider(regularPolygon.x, regularPolygon.y, polygonPoints);
        return this.polygonPoint(polygon, point);
    }
}

// ==================== CONCRETE COLLIDER CLASSES ====================

export class CircleCollider extends Collider {
    radius: number;

    constructor(x: number, y: number, radius: number) {
        super(x, y);
        this.radius = radius;
    }

    accept(visitor: CollisionVisitor): boolean {
        return visitor.visitCircle(this);
    }

    intersects(other: Collider): boolean {
        const visitor = new IntersectionVisitor(other);
        return this.accept(visitor);
    }
}

export class RectangleCollider extends Collider {
    width: number;
    height: number;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y);
        this.width = width;
        this.height = height;
    }

    accept(visitor: CollisionVisitor): boolean {
        return visitor.visitRectangle(this);
    }

    intersects(other: Collider): boolean {
        const visitor = new IntersectionVisitor(other);
        return this.accept(visitor);
    }
}

export class PolygonCollider extends Collider {
    points: { x: number; y: number }[];

    constructor(x: number, y: number, points: { x: number; y: number }[]) {
        super(x, y);
        this.points = points;
    }

    accept(visitor: CollisionVisitor): boolean {
        return visitor.visitPolygon(this);
    }

    intersects(other: Collider): boolean {
        const visitor = new IntersectionVisitor(other);
        return this.accept(visitor);
    }

    getWorldPoints(): { x: number; y: number }[] {
        return this.points.map(p => ({
            x: p.x + this.x,
            y: p.y + this.y
        }));
    }
}

export class LineSegmentCollider extends Collider {
    x2: number;
    y2: number;

    constructor(x1: number, y1: number, x2: number, y2: number) {
        super(x1, y1);
        this.x2 = x2;
        this.y2 = y2;
    }

    accept(visitor: CollisionVisitor): boolean {
        return visitor.visitLine(this);
    }

    intersects(other: Collider): boolean {
        const visitor = new IntersectionVisitor(other);
        return this.accept(visitor);
    }
}

export class PointCollider extends Collider {
    constructor(x: number, y: number) {
        super(x, y);
    }

    accept(visitor: CollisionVisitor): boolean {
        return visitor.visitPoint(this);
    }

    intersects(other: Collider): boolean {
        const visitor = new IntersectionVisitor(other);
        return this.accept(visitor);
    }
}

export class RegularPolygonCollider extends Collider {
    sides: number;
    radius: number;

    constructor(x: number, y: number, sides: number, radius: number) {
        super(x, y);
        this.sides = sides;
        this.radius = radius;
    }

    accept(visitor: CollisionVisitor): boolean {
        return visitor.visitRegularPolygon(this);
    }

    intersects(other: Collider): boolean {
        const visitor = new IntersectionVisitor(other);
        return this.accept(visitor);
    }

    generateRegularPolygonPoints(): { x: number; y: number }[] {
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i < this.sides; i++) {
            const angle = (i * 2 * Math.PI / this.sides) - Math.PI / 2;
            points.push({
                x: Math.cos(angle) * this.radius,
                y: Math.sin(angle) * this.radius
            });
        }
        return points;
    }
}
