import DeliveryNote from '../models/DeliveryNote.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import storageService from '../services/storage.service.js';
import pdfService from '../services/pdf.service.js';
import imageService from '../services/image.service.js';

export const createDeliveryNote = async (req, res) => {
    const { client, project, format, description, workDate, material, quantity, unit, hours, workers } = req.body;

    const user = await User.findById(req.user.id);

    if (!user.company) {
        throw AppError.badRequest('Debes tener una compañía asociada para crear albaranes');
    }

    const clientExists = await Client.findOne({
        _id: client,
        company: user.company
    });

    if (!clientExists) {
        throw AppError.notFound('Cliente');
    }

    const projectExists = await Project.findOne({
        _id: project,
        company: user.company
    });

    if (!projectExists) {
        throw AppError.notFound('Proyecto');
    }

    const deliveryNote = await DeliveryNote.create({
        user: req.user.id,
        company: user.company,
        client,
        project,
        format,
        description,
        workDate,
        material,
        quantity,
        unit,
        hours,
        workers
    });

    const populatedNote = await DeliveryNote.findById(deliveryNote._id)
        .populate('client')
        .populate('project');

    const io = req.app.get('io');
    if (io) {
        io.to(`company_${user.company}`).emit('deliverynote:new', {
            deliveryNote: populatedNote
        });
    }

    res.status(201).json({ data: populatedNote });
};

export const getDeliveryNotes = async (req, res) => {
    const { page, limit, client, project, format, signed, sort } = req.query;

    const user = await User.findById(req.user.id);

    const filter = { company: user.company };

    if (client) {
        filter.client = client;
    }

    if (project) {
        filter.project = project;
    }

    if (format) {
        filter.format = format;
    }

    if (signed !== undefined) {
        filter.signed = signed;
    }

    const skip = (page - 1) * limit;

    const [deliveryNotes, totalItems] = await Promise.all([
        DeliveryNote.find(filter)
            .populate('client')
            .populate('project')
            .sort(sort)
            .skip(skip)
            .limit(limit),
        DeliveryNote.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.json({
        data: deliveryNotes,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit
        }
    });
};

export const getDeliveryNote = async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(req.user.id);

    const deliveryNote = await DeliveryNote.findOne({
        _id: id,
        company: user.company
    }).populate('client').populate('project');

    if (!deliveryNote) {
        throw AppError.notFound('Albarán');
    }

    res.json({ data: deliveryNote });
};

export const signDeliveryNote = async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
        throw AppError.badRequest('No se ha proporcionado una imagen de firma');
    }

    const user = await User.findById(req.user.id);

    const deliveryNote = await DeliveryNote.findOne({
        _id: id,
        company: user.company
    }).populate('client').populate('project');

    if (!deliveryNote) {
        throw AppError.notFound('Albarán');
    }

    if (deliveryNote.signed) {
        throw AppError.badRequest('El albarán ya está firmado');
    }

    const optimizedBuffer = await imageService.optimizeSignature(req.file.buffer);

    const uploadResult = await storageService.uploadSignature(optimizedBuffer, id);

    deliveryNote.signed = true;
    deliveryNote.signedAt = new Date();
    deliveryNote.signatureUrl = uploadResult.secure_url;
    await deliveryNote.save();

    const company = await Company.findById(user.company);

    const pdfBuffer = await pdfService.generateDeliveryNotePDF(
        deliveryNote,
        company,
        deliveryNote.client,
        deliveryNote.project
    );

    const pdfUploadResult = await storageService.uploadPDF(pdfBuffer, id);

    deliveryNote.pdfUrl = pdfUploadResult.secure_url;
    await deliveryNote.save();

    const io = req.app.get('io');
    if (io) {
        io.to(`company_${user.company}`).emit('deliverynote:signed', {
            deliveryNoteId: id,
            signatureUrl: deliveryNote.signatureUrl,
            pdfUrl: deliveryNote.pdfUrl,
            signedAt: deliveryNote.signedAt
        });
    }

    res.json({
        data: deliveryNote,
        message: 'Albarán firmado correctamente'
    });
};

export const downloadPDF = async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(req.user.id);

    const deliveryNote = await DeliveryNote.findOne({
        _id: id,
        company: user.company
    }).populate('client').populate('project');

    if (!deliveryNote) {
        throw AppError.notFound('Albarán');
    }

    if (deliveryNote.signed && deliveryNote.pdfUrl) {
        return res.redirect(deliveryNote.pdfUrl);
    }

    const company = await Company.findById(user.company);

    const pdfBuffer = await pdfService.generateDeliveryNotePDF(
        deliveryNote,
        company,
        deliveryNote.client,
        deliveryNote.project
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=albaran_${id}.pdf`);
    res.send(pdfBuffer);
};

export const deleteDeliveryNote = async (req, res) => {
    const { id } = req.params;
    const { soft } = req.query;

    const user = await User.findById(req.user.id);

    const deliveryNote = await DeliveryNote.findOne({
        _id: id,
        company: user.company
    }).setOptions({ withDeleted: true });

    if (!deliveryNote) {
        throw AppError.notFound('Albarán');
    }

    if (deliveryNote.signed) {
        throw AppError.badRequest('No se puede borrar un albarán firmado');
    }

    if (soft === 'true') {
        await DeliveryNote.softDeleteById(id, req.user.id);
        res.json({ message: 'Albarán archivado correctamente' });
    } else {
        await DeliveryNote.hardDelete(id);
        res.json({ message: 'Albarán eliminado correctamente' });
    }
};