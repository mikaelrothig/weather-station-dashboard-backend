import { Request, Response, Router } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
    const routes = [
        "/windguru/wrf-9km",
        "/windguru/gfs-13km",
        "/macwind/1min",
        "/macwind/15min"
    ];

    const routesList = routes.map(route => `<li><a href="${route}">${route}</a></li>`).join('');
    const htmlResponse = `
        <h1>Kite Beach Forecast Backend</h1>
        <p>Available routes:</p>
        <ul>${routesList}</ul>
    `;
    res.send(htmlResponse);
});

export default router;